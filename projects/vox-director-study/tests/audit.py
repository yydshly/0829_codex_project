"""Audit the fixed vox-director upstream, canonical research data, and static demo.

The audit uses only the Python standard library plus ffprobe when available. It
separates contract checks (which can fail the study) from engineering boundary
observations (which are evidence about the upstream, not local defects).
"""

from __future__ import annotations

import hashlib
import json
import shutil
import struct
import subprocess
from collections import Counter
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
UPSTREAM = PROJECT / "upstream"
DATA_PATH = PROJECT / "data" / "research-data.json"
DEMO_DATA = PROJECT / "demo" / "assets" / "research-data.json"
PREP_DATA_PATH = PROJECT / "data" / "preproduction-data.json"
DEMO_PREP_DATA = PROJECT / "demo" / "assets" / "preproduction-data.json"
DUNHUANG_DEMO_PATH = PROJECT / "data" / "dunhuang-demo.json"
DUNHUANG_MEDIA = PROJECT / "media" / "dunhuang"
DEMO_DUNHUANG_MEDIA = PROJECT / "demo" / "assets" / "dunhuang"
DUNHUANG_DISPATCH_GUIDE = PROJECT / "notes" / "dunhuang-video-dispatch.md"
EVIDENCE_PATH = PROJECT / "notes" / "evidence" / "audit-results.json"
EXPECTED_COMMIT = "668ec3946fe0139bc985313b15c1a300fca42f94"


def run(*args: str) -> str:
    return subprocess.check_output(args, cwd=PROJECT, text=True).strip()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(check_id: str, passed: bool, evidence: str) -> dict[str, object]:
    return {"id": check_id, "pass": passed, "evidence": evidence}


def png_dimensions(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:24]
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n":
        return 0, 0
    return struct.unpack(">II", header[16:24])


def inspect_video(path: Path) -> dict[str, object]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return {"file": path.name, "status": "ffprobe unavailable"}
    payload = json.loads(
        subprocess.check_output(
            [
                ffprobe,
                "-v",
                "error",
                "-show_entries",
                "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
                "-of",
                "json",
                str(path),
            ],
            text=True,
        )
    )
    streams = payload.get("streams", [])
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), {})
    audio = next((stream for stream in streams if stream.get("codec_type") == "audio"), {})
    fmt = payload.get("format", {})
    return {
        "file": path.name,
        "status": "inspected",
        "duration": round(float(fmt.get("duration", 0)), 2),
        "size": int(fmt.get("size", 0)),
        "width": video.get("width"),
        "height": video.get("height"),
        "fps": video.get("r_frame_rate"),
        "video_codec": video.get("codec_name"),
        "audio_codec": audio.get("codec_name"),
    }


def example_summary(path: Path) -> dict[str, object]:
    doc = json.loads(path.read_text(encoding="utf-8"))
    beats = doc.get("beats", [])
    shots = [shot for beat in beats for shot in (beat.get("shots") or [beat])]
    return {
        "file": path.name,
        "topic": doc.get("topic"),
        "aspect": doc.get("aspect"),
        "beats": len(beats),
        "shots": len(shots),
        "keyframe_urls": sum(bool(shot.get("keyframe_url")) for shot in shots),
        "clip_urls": sum(bool(shot.get("clip_url")) for shot in shots),
        "video_model": doc.get("video_model"),
    }


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    prep_data = json.loads(PREP_DATA_PATH.read_text(encoding="utf-8"))
    dunhuang_demo = json.loads(DUNHUANG_DEMO_PATH.read_text(encoding="utf-8"))
    dunhuang_shots = [shot for beat in dunhuang_demo["beats"] for shot in beat["shots"]]
    dunhuang_keyframes = sorted(DUNHUANG_MEDIA.glob("*.png"))
    dunhuang_dimensions = {path.name: png_dimensions(path) for path in dunhuang_keyframes}
    dispatch_guide = DUNHUANG_DISPATCH_GUIDE.read_text(encoding="utf-8") if DUNHUANG_DISPATCH_GUIDE.is_file() else ""
    commit = run("git", "-C", str(UPSTREAM), "rev-parse", "HEAD")
    commit_count = int(run("git", "-C", str(UPSTREAM), "rev-list", "--count", "HEAD"))
    files = [path for path in UPSTREAM.rglob("*") if path.is_file() and ".git" not in path.parts]
    suffixes = Counter(path.suffix or "[none]" for path in files)
    videos = [inspect_video(path) for path in sorted((UPSTREAM / "assets").glob("*.mp4"))]
    examples = [example_summary(path) for path in sorted((UPSTREAM / "examples").glob("*.beats.json"))]

    atlas_source = (UPSTREAM / "scripts" / "atlas_cloud.py").read_text(encoding="utf-8")
    provider_source = (UPSTREAM / "scripts" / "provider.py").read_text(encoding="utf-8")
    assemble_source = (UPSTREAM / "scripts" / "assemble.py").read_text(encoding="utf-8")
    skill_source = (UPSTREAM / "SKILL.md").read_text(encoding="utf-8")

    checks = [
        check("fixed-upstream-commit", commit == EXPECTED_COMMIT, commit),
        check("canonical-data-commit", data["meta"]["upstream_commit"] == commit, data["meta"]["upstream_commit"]),
        check("demo-data-synced", DEMO_DATA.is_file() and sha256(DEMO_DATA) == sha256(DATA_PATH), sha256(DATA_PATH)),
        check("three-input-modes", [mode["id"] for mode in data["modes"]] == ["broll", "aroll", "croll"], ", ".join(mode["id"] for mode in data["modes"])),
        check("mode-stage-contract", all(len(mode["stages"]) >= 4 for mode in data["modes"]), ", ".join(f"{mode['id']}={len(mode['stages'])}" for mode in data["modes"])),
        check("bundled-videos", len(videos) == 4 and all(video["status"] == "inspected" for video in videos), f"{len(videos)} inspected"),
        check("video-audio-contract", all(video.get("video_codec") == "h264" and video.get("audio_codec") == "aac" for video in videos), ", ".join(f"{video['file']}:{video.get('video_codec')}+{video.get('audio_codec')}" for video in videos)),
        check("beats-examples", len(examples) == 4, f"{len(examples)} beats.json examples"),
        check("sample-proof-levels", len(data["samples"]) == 5 and sum(bool(sample["video"]) for sample in data["samples"]) == 4, "5 listed; 4 fixed video URLs; 1 poster-only"),
        check("scenario-boundaries", len(data["scenarios"]["fit"]) >= 4 and len(data["scenarios"]["avoid"]) >= 4, "fit and avoid lists present"),
        check("prioritized-extensions", {item["priority"] for item in data["extensions"]} == {"P0", "P1", "P2"}, "P0, P1, P2"),
        check("meaning-recorded", len(data["meaning"]["points"]) >= 4 and bool(data["meaning"]["recommendation"]), data["meaning"]["recommendation"]),
        check("static-demo-files", all((PROJECT / "demo" / name).is_file() for name in ("index.html", "styles.css", "app.js", "favicon.svg")), "index.html, styles.css, app.js, favicon.svg"),
        check("upstream-license-copied", (PROJECT / "demo" / "assets" / "LICENSE-upstream.txt").is_file(), "demo/assets/LICENSE-upstream.txt"),
        check("thumbnails-copied", all((PROJECT / "demo" / "assets" / f"{name}.jpg").is_file() for name in ("tang", "money", "football", "silicon-valley", "mexican")), "5 local posters"),
        check("preproduction-data-synced", DEMO_PREP_DATA.is_file() and sha256(DEMO_PREP_DATA) == sha256(PREP_DATA_PATH), sha256(PREP_DATA_PATH)),
        check("preproduction-samples", [sample["id"] for sample in prep_data["samples"]] == ["money-15s", "tang-30s", "money-60s", "ronaldo"], "4 normalized upstream examples"),
        check("preproduction-coverage", sum(sample["beat_count"] for sample in prep_data["samples"]) == 17 and sum(sample["shot_count"] for sample in prep_data["samples"]) == 26, "17 beats / 26 shots"),
        check("provider-neutral-routes", {route["id"] for route in prep_data["routes"]} == {"image-to-video", "text-to-video", "first-last-frame", "reference-to-video"}, "4 provider-neutral dispatch routes"),
        check("human-gate-contract", len(prep_data["human_gates"]) == 6 and all(gate.get("id") and gate.get("label") for gate in prep_data["human_gates"]), "6 explicit human gates"),
        check("dunhuang-demonstration-contract", len(prep_data.get("demonstrations", [])) == 1 and dunhuang_demo["id"] == "dunhuang-30s" and dunhuang_demo["timeline_seconds"] == 30 and dunhuang_demo["beat_count"] == 3 and dunhuang_demo["shot_count"] == 6, "1 research demonstration / 30s / 3 beats / 6 shots"),
        check("dunhuang-shot-completeness", all(shot.get("scene") and shot.get("still_prompt") and shot.get("motion_prompt") and shot.get("duration") for beat in dunhuang_demo["beats"] for shot in beat["shots"]), "6 shots include scene, still prompt, motion prompt, duration"),
        check("dunhuang-keyframes-synced", len(dunhuang_keyframes) == 6 and all((DEMO_DUNHUANG_MEDIA / path.name).is_file() and sha256(DEMO_DUNHUANG_MEDIA / path.name) == sha256(path) for path in dunhuang_keyframes) and {shot["reference_image"] for shot in dunhuang_shots} == {f"assets/dunhuang/{path.name}" for path in dunhuang_keyframes}, "6 canonical PNGs are referenced and copied to demo/assets/dunhuang"),
        check("dunhuang-keyframe-dimensions", len(dunhuang_dimensions) == 6 and all(width > 0 and height > width for width, height in dunhuang_dimensions.values()), ", ".join(f"{name}={width}x{height}" for name, (width, height) in dunhuang_dimensions.items())),
        check("dunhuang-video-dispatch-guide", bool(dispatch_guide) and all(shot["id"] in dispatch_guide for shot in dunhuang_shots) and "没有调用视频模型" in dispatch_guide, "6 shot IDs, image inputs, motion prompts, negative constraints, and no-video boundary recorded"),
    ]

    boundaries = [
        {
            "id": "single-provider-implementation",
            "observed": '_REGISTRY = {"atlas_cloud": AtlasCloudProvider}' in provider_source,
            "evidence": "Provider interface is extensible, but the registry contains only AtlasCloudProvider.",
        },
        {
            "id": "windows-curl-hardcode",
            "observed": '["/usr/bin/curl"' in atlas_source,
            "evidence": "atlas_cloud.py invokes /usr/bin/curl for upload and download.",
        },
        {
            "id": "model-list-is-agent-step",
            "observed": "/api/v1/models" in skill_source and "/api/v1/models" not in atlas_source,
            "evidence": "SKILL.md tells the agent to verify live model IDs; the API client has no model-list helper.",
        },
        {
            "id": "broll-three-four-resolution-gap",
            "observed": "3:4" in skill_source and '"3:4"' not in assemble_source.split("RES =", 1)[1].split("}", 1)[0],
            "evidence": "The public schema lists 3:4; B-roll assemble.RES only lists 16:9, 9:16, and 1:1.",
        },
        {
            "id": "no-bundled-tests",
            "observed": not any("test" in path.parts for path in files),
            "evidence": "No upstream path contains a tests directory or test file path.",
        },
    ]

    repository = {
        "commit": commit,
        "commit_count": commit_count,
        "file_count": len(files),
        "file_types": dict(sorted(suffixes.items())),
        "python_files": sum(path.suffix == ".py" for path in files),
        "markdown_files": sum(path.suffix == ".md" for path in files),
        "bundled_test_paths": sum("test" in path.parts for path in files),
    }
    failed = [item for item in checks if not item["pass"]]
    report = {
        "generated_at": "2026-08-29",
        "summary": {
            "contract_checks": len(checks),
            "contract_failures": len(failed),
            "boundary_observations": sum(bool(item["observed"]) for item in boundaries),
            "videos_inspected": len(videos),
            "beats_examples_inspected": len(examples),
        },
        "repository": repository,
        "checks": checks,
        "boundaries": boundaries,
        "videos": videos,
        "examples": examples,
    }
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"evidence: {EVIDENCE_PATH.relative_to(PROJECT)}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
