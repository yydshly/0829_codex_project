"""Create an authorized MiniMax cloned voice for the reference-video pipeline."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import requests


PROJECT = Path(__file__).resolve().parents[1]
DEFAULT_STATE = PROJECT / "media" / "minimax-cloned-voice.json"
VOICE_ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{6,254}[A-Za-z0-9]$")
ALLOWED_SUFFIXES = {".mp3", ".m4a", ".wav"}


def media_duration(path: Path) -> float:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise SystemExit("ffprobe is required to validate reference-audio duration")
    output = subprocess.check_output(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        text=True,
    )
    return float(output.strip())


def validate_audio(path: Path, *, prompt: bool = False) -> float:
    if not path.is_file():
        raise SystemExit(f"audio file not found: {path}")
    if path.suffix.lower() not in ALLOWED_SUFFIXES:
        raise SystemExit("MiniMax voice cloning accepts only mp3, m4a, or wav")
    if path.stat().st_size > 20 * 1024 * 1024:
        raise SystemExit("reference audio exceeds the MiniMax 20 MB limit")
    duration = media_duration(path)
    if prompt and duration >= 8:
        raise SystemExit(f"prompt audio must be shorter than 8 seconds; observed {duration:.2f}s")
    if not prompt and not 10 <= duration <= 300:
        raise SystemExit(
            f"clone audio must be between 10 and 300 seconds; observed {duration:.2f}s"
        )
    return duration


def require_success(response: requests.Response, operation: str) -> dict[str, object]:
    try:
        payload = response.json()
    except ValueError as error:
        raise SystemExit(f"{operation} returned non-JSON HTTP {response.status_code}") from error
    if not response.ok:
        message = payload.get("base_resp", {}).get("status_msg") if isinstance(payload, dict) else None
        raise SystemExit(f"{operation} failed (HTTP {response.status_code}): {message or 'unknown error'}")
    base = payload.get("base_resp", {}) if isinstance(payload, dict) else {}
    if base and int(base.get("status_code", 0)) != 0:
        raise SystemExit(f"{operation} failed: {base.get('status_msg', 'unknown error')}")
    return payload


def upload_audio(
    session: requests.Session, api_host: str, path: Path, purpose: str
) -> int:
    with path.open("rb") as stream:
        response = session.post(
            f"{api_host.rstrip('/')}/v1/files/upload",
            data={"purpose": purpose},
            files={"file": (path.name, stream)},
            timeout=180,
        )
    payload = require_success(response, f"upload {purpose} audio")
    try:
        return int(payload["file"]["file_id"])  # type: ignore[index]
    except (KeyError, TypeError, ValueError) as error:
        raise SystemExit(f"upload {purpose} audio returned no file_id") from error


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Upload an authorized reference voice and create a MiniMax voice_id."
    )
    parser.add_argument("--input", required=True, type=Path, help="10s-5min authorized voice sample")
    parser.add_argument("--voice-id", required=True, help="unique 8-256 character custom voice ID")
    parser.add_argument("--transcript", help="optional exact transcript, up to 200 characters")
    parser.add_argument("--accuracy", type=float, default=0.7, help="ASR similarity threshold")
    parser.add_argument("--prompt-audio", type=Path, help="optional enhancement sample shorter than 8s")
    parser.add_argument("--prompt-text", help="exact transcript for --prompt-audio")
    parser.add_argument("--preview-text", help="optional billed preview text, up to 1000 characters")
    parser.add_argument("--model", default="speech-2.8-hd")
    parser.add_argument("--api-host", default="https://api.minimaxi.com")
    parser.add_argument("--noise-reduction", action="store_true")
    parser.add_argument("--volume-normalization", action="store_true")
    parser.add_argument("--authorized", action="store_true", help="confirm consent and usage rights")
    parser.add_argument("--state-output", type=Path, default=DEFAULT_STATE)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.authorized:
        raise SystemExit(
            "voice cloning requires --authorized to confirm the speaker consented and you hold usage rights"
        )
    if not VOICE_ID_PATTERN.fullmatch(args.voice_id):
        raise SystemExit(
            "voice_id must be 8-256 characters, start with a letter, end with a letter/digit, "
            "and contain only letters, digits, hyphen, or underscore"
        )
    if args.transcript and len(args.transcript) > 200:
        raise SystemExit("--transcript cannot exceed 200 characters")
    if not 0 <= args.accuracy <= 1:
        raise SystemExit("--accuracy must be between 0 and 1")
    if bool(args.prompt_audio) != bool(args.prompt_text):
        raise SystemExit("--prompt-audio and --prompt-text must be supplied together")
    if args.preview_text and len(args.preview_text) > 1000:
        raise SystemExit("--preview-text cannot exceed 1000 characters")

    clone_input = args.input.resolve()
    clone_duration = validate_audio(clone_input)
    prompt_duration = None
    prompt_path = args.prompt_audio.resolve() if args.prompt_audio else None
    if prompt_path:
        prompt_duration = validate_audio(prompt_path, prompt=True)

    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("MINIMAX_API_KEY is required")

    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {api_key}"})
    clone_file_id = upload_audio(session, args.api_host, clone_input, "voice_clone")
    payload: dict[str, object] = {
        "file_id": clone_file_id,
        "voice_id": args.voice_id,
        "need_noise_reduction": args.noise_reduction,
        "need_volume_normalization": args.volume_normalization,
        "aigc_watermark": False,
    }
    if args.transcript:
        payload["text_validation"] = args.transcript
        payload["accuracy"] = args.accuracy
    if prompt_path:
        prompt_file_id = upload_audio(session, args.api_host, prompt_path, "prompt_audio")
        payload["clone_prompt"] = {
            "prompt_audio": prompt_file_id,
            "prompt_text": args.prompt_text,
        }
    if args.preview_text:
        payload["text"] = args.preview_text
        payload["model"] = args.model

    response = session.post(
        f"{args.api_host.rstrip('/')}/v1/voice_clone",
        json=payload,
        timeout=180,
    )
    result = require_success(response, "voice clone")
    state = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "voice_id": args.voice_id,
        "model": args.model,
        "api_host": args.api_host,
        "authorized": True,
        "source_file": clone_input.name,
        "source_duration_seconds": round(clone_duration, 3),
        "prompt_duration_seconds": round(prompt_duration, 3) if prompt_duration else None,
        "noise_reduction": args.noise_reduction,
        "volume_normalization": args.volume_normalization,
        "demo_audio": result.get("demo_audio") or None,
    }
    output = args.state_output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"voice_id": args.voice_id, "state": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
