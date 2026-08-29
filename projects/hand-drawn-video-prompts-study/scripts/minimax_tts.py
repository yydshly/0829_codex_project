"""Generate one validated MiniMax TTS clip without exposing the API key."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate and validate one MiniMax TTS clip.")
    parser.add_argument("--text", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--api-host", default="https://api.minimaxi.com")
    parser.add_argument("--model", default="speech-2.8-hd")
    parser.add_argument("--voice-id", default="Chinese (Mandarin)_News_Anchor")
    parser.add_argument("--speed", type=float, default=1.08)
    parser.add_argument(
        "--emotion",
        choices=("happy", "sad", "angry", "fearful", "disgusted", "surprised", "calm", "fluent", "whipser"),
        default=None,
    )
    parser.add_argument("--attempts", type=int, default=3)
    return parser.parse_args()


def audio_duration_ms(path: Path) -> int:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required to validate MiniMax audio")
    result = subprocess.run(
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
        check=True,
        capture_output=True,
        text=True,
    )
    return round(float(result.stdout.strip()) * 1000)


def expected_minimum_ms(text: str, speed: float) -> int:
    # Deliberately conservative: natural Mandarin is normally much slower than
    # ten readable characters per second. This catches successful-but-empty or
    # clause-truncated API responses without prescribing the final pacing.
    readable_units = len(re.findall(r"[\u3400-\u9fffA-Za-z0-9]", text))
    return max(700, round(readable_units * 100 / max(speed, 1.0)))


def require_payload(response: requests.Response) -> dict[str, object]:
    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError(f"MiniMax returned non-JSON HTTP {response.status_code}") from error
    if not response.ok:
        raise RuntimeError(f"MiniMax returned HTTP {response.status_code}")
    base = payload.get("base_resp") if isinstance(payload, dict) else None
    if not isinstance(base, dict) or int(base.get("status_code", -1)) != 0:
        message = base.get("status_msg", "malformed response") if isinstance(base, dict) else "malformed response"
        raise RuntimeError(f"MiniMax TTS error: {message}")
    data = payload.get("data")
    if not isinstance(data, dict) or int(data.get("status", -1)) != 2:
        raise RuntimeError("MiniMax TTS response was not complete (data.status != 2)")
    return payload


def download_audio(session: requests.Session, reference: str) -> bytes:
    parsed = urlparse(reference)
    if parsed.scheme in {"http", "https"}:
        response = session.get(reference, timeout=180)
        response.raise_for_status()
        return response.content
    try:
        return bytes.fromhex(reference)
    except ValueError as error:
        raise RuntimeError("MiniMax returned neither an audio URL nor valid hex audio") from error


def main() -> None:
    args = parse_args()
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("MINIMAX_API_KEY is required")
    if not 0.5 <= args.speed <= 2.0:
        raise SystemExit("--speed must be between 0.5 and 2.0")
    if args.attempts < 1 or args.attempts > 5:
        raise SystemExit("--attempts must be between 1 and 5")

    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".partial")
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {api_key}"})
    payload = {
        "model": args.model,
        "text": args.text,
        "stream": False,
        "language_boost": "Chinese",
        "output_format": "url",
        "voice_setting": {
            "voice_id": args.voice_id,
            "speed": args.speed,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1,
        },
        "subtitle_enable": False,
    }
    if args.emotion:
        payload["voice_setting"]["emotion"] = args.emotion
    minimum_ms = expected_minimum_ms(args.text, args.speed)
    last_error: Exception | None = None

    try:
        for attempt in range(1, args.attempts + 1):
            try:
                response = session.post(
                    f"{args.api_host.rstrip('/')}/v1/t2a_v2",
                    json=payload,
                    timeout=180,
                )
                result = require_payload(response)
                data = result["data"]
                assert isinstance(data, dict)
                audio_reference = str(data.get("audio", ""))
                audio_bytes = download_audio(session, audio_reference)
                if len(audio_bytes) < 1024:
                    raise RuntimeError(f"MiniMax audio was unexpectedly small ({len(audio_bytes)} bytes)")
                temporary.write_bytes(audio_bytes)
                observed_ms = audio_duration_ms(temporary)
                extra = result.get("extra_info")
                extra = extra if isinstance(extra, dict) else {}
                usage_characters = int(extra.get("usage_characters", 0) or 0)
                if usage_characters and usage_characters < max(1, len(args.text.strip()) // 2):
                    raise RuntimeError(
                        f"MiniMax used only {usage_characters} of {len(args.text.strip())} input characters"
                    )
                if observed_ms < minimum_ms:
                    raise RuntimeError(
                        f"MiniMax audio was too short ({observed_ms}ms; expected at least {minimum_ms}ms)"
                    )
                temporary.replace(output)
                print(
                    json.dumps(
                        {
                            "duration_ms": observed_ms,
                            "usage_characters": usage_characters,
                            "trace_id": result.get("trace_id"),
                            "attempt": attempt,
                        },
                        ensure_ascii=True,
                    )
                )
                return
            except (requests.RequestException, RuntimeError, subprocess.SubprocessError, ValueError) as error:
                last_error = error
                if temporary.exists():
                    temporary.unlink()
                if attempt < args.attempts:
                    time.sleep(attempt)
        raise SystemExit(f"MiniMax TTS failed after {args.attempts} attempts: {last_error}")
    finally:
        if temporary.exists():
            temporary.unlink()


if __name__ == "__main__":
    main()
