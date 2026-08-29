"""Design one MiniMax voice from text and save its trial audio without exposing credentials."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create and validate a MiniMax Voice Design trial.")
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--preview-text", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--api-host", default="https://api.minimaxi.com")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("MINIMAX_API_KEY is required")
    if len(args.preview_text) > 500:
        raise SystemExit("--preview-text must not exceed 500 characters")

    response = requests.post(
        f"{args.api_host.rstrip('/')}/v1/voice_design",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "prompt": args.prompt,
            "preview_text": args.preview_text,
            "aigc_watermark": False,
        },
        timeout=180,
    )
    try:
        payload = response.json()
    except ValueError as error:
        raise SystemExit(f"MiniMax returned non-JSON HTTP {response.status_code}") from error
    base = payload.get("base_resp") if isinstance(payload, dict) else None
    if not response.ok or not isinstance(base, dict) or int(base.get("status_code", -1)) != 0:
        message = base.get("status_msg", "malformed response") if isinstance(base, dict) else "malformed response"
        raise SystemExit(f"MiniMax Voice Design failed: {message}")

    voice_id = str(payload.get("voice_id", "")).strip()
    audio_hex = str(payload.get("trial_audio", "")).strip()
    if not voice_id or not audio_hex:
        raise SystemExit("MiniMax Voice Design returned no voice_id or trial_audio")
    try:
        audio_bytes = bytes.fromhex(audio_hex)
    except ValueError as error:
        raise SystemExit("MiniMax Voice Design returned invalid trial audio") from error
    if len(audio_bytes) < 1024:
        raise SystemExit(f"MiniMax trial audio was unexpectedly small ({len(audio_bytes)} bytes)")

    output = args.output.resolve()
    metadata = args.metadata.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    metadata.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(audio_bytes)
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,size:stream=codec_name,sample_rate,channels",
            "-of",
            "json",
            str(output),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    media = json.loads(probe.stdout)
    metadata.write_text(
        json.dumps(
            {
                "provider": "MiniMax Voice Design",
                "voice_id": voice_id,
                "prompt": args.prompt,
                "preview_text": args.preview_text,
                "media": media,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"voice_id": voice_id, "output": str(output), "metadata": str(metadata)}, ensure_ascii=True))


if __name__ == "__main__":
    main()
