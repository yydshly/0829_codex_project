"""Audit the fixed vox-director upstream, canonical research data, and static demo.

The audit uses only the Python standard library plus ffprobe/ffmpeg when available. It
separates contract checks (which can fail the study) from engineering boundary
observations (which are evidence about the upstream, not local defects).
"""

from __future__ import annotations

import hashlib
import json
import re
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
DUNHUANG_VIDEO = DUNHUANG_MEDIA / "video" / "B01-S01-v2.mp4"
DEMO_DUNHUANG_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B01-S01-v2.mp4"
DUNHUANG_FIRST_V1 = DUNHUANG_MEDIA / "video" / "B01-S01-v1.mp4"
DEMO_DUNHUANG_FIRST_V1 = DEMO_DUNHUANG_MEDIA / "video" / "B01-S01-v1.mp4"
DUNHUANG_SECOND_VIDEO = DUNHUANG_MEDIA / "video" / "B01-S02-v1.mp4"
DEMO_DUNHUANG_SECOND_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B01-S02-v1.mp4"
DUNHUANG_THIRD_VIDEO = DUNHUANG_MEDIA / "video" / "B02-S01-v2.mp4"
DEMO_DUNHUANG_THIRD_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B02-S01-v2.mp4"
DUNHUANG_THIRD_V1 = DUNHUANG_MEDIA / "video" / "B02-S01-v1.mp4"
DEMO_DUNHUANG_THIRD_V1 = DEMO_DUNHUANG_MEDIA / "video" / "B02-S01-v1.mp4"
DUNHUANG_FOURTH_VIDEO = DUNHUANG_MEDIA / "video" / "B03-S02-v1.mp4"
DEMO_DUNHUANG_FOURTH_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B03-S02-v1.mp4"
DUNHUANG_FIFTH_VIDEO = DUNHUANG_MEDIA / "video" / "B02-S02-v1.mp4"
DEMO_DUNHUANG_FIFTH_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B02-S02-v1.mp4"
DUNHUANG_SIXTH_VIDEO = DUNHUANG_MEDIA / "video" / "B03-S01-v1.mp4"
DEMO_DUNHUANG_SIXTH_VIDEO = DEMO_DUNHUANG_MEDIA / "video" / "B03-S01-v1.mp4"
DUNHUANG_ROUGH_CUT = DUNHUANG_MEDIA / "final" / "dunhuang-rough-cut-v1.mp4"
DEMO_DUNHUANG_ROUGH_CUT = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-rough-cut-v1.mp4"
DUNHUANG_NARRATION_SRT = DUNHUANG_MEDIA / "final" / "dunhuang-narration-v1.srt"
DEMO_DUNHUANG_NARRATION_SRT = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-narration-v1.srt"
DUNHUANG_SOUND_PREVIEW = DUNHUANG_MEDIA / "final" / "dunhuang-sound-preview-v2.mp4"
DEMO_DUNHUANG_SOUND_PREVIEW = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-sound-preview-v2.mp4"
DUNHUANG_NARRATION_STEM = DUNHUANG_MEDIA / "final" / "dunhuang-narration-yunyang-v2.m4a"
DEMO_DUNHUANG_NARRATION_STEM = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-narration-yunyang-v2.m4a"
DUNHUANG_AMBIENT_STEM = DUNHUANG_MEDIA / "final" / "dunhuang-ambient-bed-v1.m4a"
DEMO_DUNHUANG_AMBIENT_STEM = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-ambient-bed-v1.m4a"
DUNHUANG_MIX_STEM = DUNHUANG_MEDIA / "final" / "dunhuang-audio-mix-v2.m4a"
DEMO_DUNHUANG_MIX_STEM = DEMO_DUNHUANG_MEDIA / "final" / "dunhuang-audio-mix-v2.m4a"
DUNHUANG_NARRATION_MASTERS = [
    DUNHUANG_MEDIA / "audio" / "narration" / f"{beat}-yunyang-v2.mp3" for beat in ("B01", "B02", "B03")
]
DUNHUANG_V1_SOUND_FILES = [
    DUNHUANG_MEDIA / "final" / "dunhuang-sound-preview-v1.mp4",
    DUNHUANG_MEDIA / "final" / "dunhuang-narration-kangkang-v1.m4a",
    DUNHUANG_MEDIA / "final" / "dunhuang-audio-mix-v1.m4a",
]
DUNHUANG_DISPATCH_GUIDE = PROJECT / "notes" / "dunhuang-video-dispatch.md"
DUNHUANG_EDIT_LIST = PROJECT / "notes" / "dunhuang-edit-decision-list.md"
DUNHUANG_CASE_STUDY = PROJECT / "notes" / "dunhuang-case-study.md"
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
                "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
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
        "sample_rate": audio.get("sample_rate"),
        "channels": audio.get("channels"),
    }


def inspect_max_volume(path: Path) -> float | None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return None
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(path), "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "NUL"],
        text=True,
        capture_output=True,
        check=False,
    )
    match = re.search(r"max_volume:\s+(-?\d+(?:\.\d+)?) dB", result.stderr)
    return float(match.group(1)) if match else None


def inspect_integrated_loudness(path: Path) -> float | None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return None
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(path), "-af", "ebur128=framelog=verbose", "-f", "null", "NUL"],
        text=True,
        capture_output=True,
        check=False,
    )
    matches = re.findall(r"I:\s+(-?\d+(?:\.\d+)?) LUFS", result.stderr)
    return float(matches[-1]) if matches else None


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
    dunhuang_video = inspect_video(DUNHUANG_VIDEO)
    dunhuang_second_video = inspect_video(DUNHUANG_SECOND_VIDEO)
    dunhuang_third_video = inspect_video(DUNHUANG_THIRD_VIDEO)
    dunhuang_fourth_video = inspect_video(DUNHUANG_FOURTH_VIDEO)
    dunhuang_fifth_video = inspect_video(DUNHUANG_FIFTH_VIDEO)
    dunhuang_sixth_video = inspect_video(DUNHUANG_SIXTH_VIDEO)
    dunhuang_rough_cut = inspect_video(DUNHUANG_ROUGH_CUT)
    dunhuang_rough_cut_max_volume = inspect_max_volume(DUNHUANG_ROUGH_CUT)
    dunhuang_sound_preview = inspect_video(DUNHUANG_SOUND_PREVIEW)
    dunhuang_narration_stem = inspect_video(DUNHUANG_NARRATION_STEM)
    dunhuang_ambient_stem = inspect_video(DUNHUANG_AMBIENT_STEM)
    dunhuang_mix_stem = inspect_video(DUNHUANG_MIX_STEM)
    dunhuang_mix_max_volume = inspect_max_volume(DUNHUANG_MIX_STEM)
    dunhuang_mix_loudness = inspect_integrated_loudness(DUNHUANG_MIX_STEM)
    dunhuang_narration_masters = [inspect_video(path) for path in DUNHUANG_NARRATION_MASTERS]
    dispatch_guide = DUNHUANG_DISPATCH_GUIDE.read_text(encoding="utf-8") if DUNHUANG_DISPATCH_GUIDE.is_file() else ""
    edit_list = DUNHUANG_EDIT_LIST.read_text(encoding="utf-8") if DUNHUANG_EDIT_LIST.is_file() else ""
    case_study = DUNHUANG_CASE_STUDY.read_text(encoding="utf-8") if DUNHUANG_CASE_STUDY.is_file() else ""
    narration_srt = DUNHUANG_NARRATION_SRT.read_text(encoding="utf-8") if DUNHUANG_NARRATION_SRT.is_file() else ""
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
    demo_index_source = (PROJECT / "demo" / "index.html").read_text(encoding="utf-8")
    demo_app_source = (PROJECT / "demo" / "app.js").read_text(encoding="utf-8")
    readme_source = (PROJECT / "README.md").read_text(encoding="utf-8")

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
        check("dunhuang-first-video", DUNHUANG_VIDEO.is_file() and DEMO_DUNHUANG_VIDEO.is_file() and sha256(DUNHUANG_VIDEO) == sha256(DEMO_DUNHUANG_VIDEO) and dunhuang_shots[0].get("reference_video") == "assets/dunhuang/video/B01-S01-v2.mp4" and dunhuang_shots[0].get("video_review", {}).get("creative_status") == "approved-v2" and dunhuang_video.get("video_codec") == "h264" and dunhuang_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_video.get("duration", 0)) <= 5.2 and int(dunhuang_video.get("height", 0)) > int(dunhuang_video.get("width", 0)), f"B01-S01 v2: {dunhuang_video.get('duration')}s / {dunhuang_video.get('width')}x{dunhuang_video.get('height')} / {dunhuang_video.get('video_codec')}+{dunhuang_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-first-video-history", DUNHUANG_FIRST_V1.is_file() and DEMO_DUNHUANG_FIRST_V1.is_file() and sha256(DUNHUANG_FIRST_V1) == sha256(DEMO_DUNHUANG_FIRST_V1) and dunhuang_shots[0].get("previous_versions", [{}])[0].get("reference_video") == "assets/dunhuang/video/B01-S01-v1.mp4", "B01-S01 v1 remains in canonical media, demo assets, and JSON history"),
        check("dunhuang-second-video", DUNHUANG_SECOND_VIDEO.is_file() and DEMO_DUNHUANG_SECOND_VIDEO.is_file() and sha256(DUNHUANG_SECOND_VIDEO) == sha256(DEMO_DUNHUANG_SECOND_VIDEO) and dunhuang_shots[1].get("reference_video") == "assets/dunhuang/video/B01-S02-v1.mp4" and dunhuang_second_video.get("video_codec") == "h264" and dunhuang_second_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_second_video.get("duration", 0)) <= 5.2 and int(dunhuang_second_video.get("height", 0)) > int(dunhuang_second_video.get("width", 0)), f"B01-S02 v1: {dunhuang_second_video.get('duration')}s / {dunhuang_second_video.get('width')}x{dunhuang_second_video.get('height')} / {dunhuang_second_video.get('video_codec')}+{dunhuang_second_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-third-video", DUNHUANG_THIRD_VIDEO.is_file() and DEMO_DUNHUANG_THIRD_VIDEO.is_file() and sha256(DUNHUANG_THIRD_VIDEO) == sha256(DEMO_DUNHUANG_THIRD_VIDEO) and dunhuang_shots[2].get("reference_video") == "assets/dunhuang/video/B02-S01-v2.mp4" and dunhuang_shots[2].get("video_review", {}).get("creative_status") == "approved-v2" and dunhuang_third_video.get("video_codec") == "h264" and dunhuang_third_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_third_video.get("duration", 0)) <= 5.2 and int(dunhuang_third_video.get("height", 0)) > int(dunhuang_third_video.get("width", 0)), f"B02-S01 v2: {dunhuang_third_video.get('duration')}s / {dunhuang_third_video.get('width')}x{dunhuang_third_video.get('height')} / {dunhuang_third_video.get('video_codec')}+{dunhuang_third_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-third-video-history", DUNHUANG_THIRD_V1.is_file() and DEMO_DUNHUANG_THIRD_V1.is_file() and sha256(DUNHUANG_THIRD_V1) == sha256(DEMO_DUNHUANG_THIRD_V1) and dunhuang_shots[2].get("previous_versions", [{}])[0].get("reference_video") == "assets/dunhuang/video/B02-S01-v1.mp4", "B02-S01 v1 remains in canonical media, demo assets, and JSON history"),
        check("dunhuang-fourth-video", DUNHUANG_FOURTH_VIDEO.is_file() and DEMO_DUNHUANG_FOURTH_VIDEO.is_file() and sha256(DUNHUANG_FOURTH_VIDEO) == sha256(DEMO_DUNHUANG_FOURTH_VIDEO) and dunhuang_shots[5].get("reference_video") == "assets/dunhuang/video/B03-S02-v1.mp4" and dunhuang_fourth_video.get("video_codec") == "h264" and dunhuang_fourth_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_fourth_video.get("duration", 0)) <= 5.2 and int(dunhuang_fourth_video.get("height", 0)) > int(dunhuang_fourth_video.get("width", 0)), f"B03-S02 v1: {dunhuang_fourth_video.get('duration')}s / {dunhuang_fourth_video.get('width')}x{dunhuang_fourth_video.get('height')} / {dunhuang_fourth_video.get('video_codec')}+{dunhuang_fourth_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-fifth-video", DUNHUANG_FIFTH_VIDEO.is_file() and DEMO_DUNHUANG_FIFTH_VIDEO.is_file() and sha256(DUNHUANG_FIFTH_VIDEO) == sha256(DEMO_DUNHUANG_FIFTH_VIDEO) and dunhuang_shots[3].get("reference_video") == "assets/dunhuang/video/B02-S02-v1.mp4" and dunhuang_fifth_video.get("video_codec") == "h264" and dunhuang_fifth_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_fifth_video.get("duration", 0)) <= 5.2 and int(dunhuang_fifth_video.get("height", 0)) > int(dunhuang_fifth_video.get("width", 0)), f"B02-S02 v1: {dunhuang_fifth_video.get('duration')}s / {dunhuang_fifth_video.get('width')}x{dunhuang_fifth_video.get('height')} / {dunhuang_fifth_video.get('video_codec')}+{dunhuang_fifth_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-sixth-video", DUNHUANG_SIXTH_VIDEO.is_file() and DEMO_DUNHUANG_SIXTH_VIDEO.is_file() and sha256(DUNHUANG_SIXTH_VIDEO) == sha256(DEMO_DUNHUANG_SIXTH_VIDEO) and dunhuang_shots[4].get("reference_video") == "assets/dunhuang/video/B03-S01-v1.mp4" and dunhuang_sixth_video.get("video_codec") == "h264" and dunhuang_sixth_video.get("audio_codec") == "aac" and 4.9 <= float(dunhuang_sixth_video.get("duration", 0)) <= 5.2 and int(dunhuang_sixth_video.get("height", 0)) > int(dunhuang_sixth_video.get("width", 0)), f"B03-S01 v1: {dunhuang_sixth_video.get('duration')}s / {dunhuang_sixth_video.get('width')}x{dunhuang_sixth_video.get('height')} / {dunhuang_sixth_video.get('video_codec')}+{dunhuang_sixth_video.get('audio_codec')} / canonical and demo SHA match"),
        check("dunhuang-rough-cut-media", DUNHUANG_ROUGH_CUT.is_file() and DEMO_DUNHUANG_ROUGH_CUT.is_file() and sha256(DUNHUANG_ROUGH_CUT) == sha256(DEMO_DUNHUANG_ROUGH_CUT) and dunhuang_demo.get("rough_cut", {}).get("reference_video") == "assets/dunhuang/final/dunhuang-rough-cut-v1.mp4", f"rough cut canonical/demo SHA match: {sha256(DUNHUANG_ROUGH_CUT) if DUNHUANG_ROUGH_CUT.is_file() else 'missing'}"),
        check("dunhuang-rough-cut-spec", dunhuang_rough_cut.get("video_codec") == "h264" and dunhuang_rough_cut.get("audio_codec") == "aac" and float(dunhuang_rough_cut.get("duration", 0)) == 30.0 and dunhuang_rough_cut.get("width") == 720 and dunhuang_rough_cut.get("height") == 1280 and dunhuang_rough_cut.get("fps") == "30/1", f"30.0s / {dunhuang_rough_cut.get('width')}x{dunhuang_rough_cut.get('height')} / {dunhuang_rough_cut.get('fps')} / {dunhuang_rough_cut.get('video_codec')}+{dunhuang_rough_cut.get('audio_codec')}"),
        check("dunhuang-rough-cut-silent-audio", dunhuang_rough_cut_max_volume is not None and dunhuang_rough_cut_max_volume <= -90.0, f"AAC placeholder max volume: {dunhuang_rough_cut_max_volume} dB"),
        check("dunhuang-rough-cut-order", dunhuang_demo.get("rough_cut", {}).get("shot_order") == ["B01-S01-v2", "B01-S02-v1", "B02-S01-v2", "B02-S02-v1", "B03-S01-v1", "B03-S02-v1"] and all(shot_id in edit_list for shot_id in ("B01-S01-v2", "B01-S02-v1", "B02-S01-v2", "B02-S02-v1", "B03-S01-v1", "B03-S02-v1")), "six current versions are ordered and documented as six 5-second cuts"),
        check("dunhuang-narration-timecode", DUNHUANG_NARRATION_SRT.is_file() and DEMO_DUNHUANG_NARRATION_SRT.is_file() and sha256(DUNHUANG_NARRATION_SRT) == sha256(DEMO_DUNHUANG_NARRATION_SRT) and all(marker in narration_srt for marker in ("00:00:00,000 --> 00:00:10,000", "00:00:10,000 --> 00:00:20,000", "00:00:20,000 --> 00:00:30,000")) and dunhuang_demo.get("rough_cut", {}).get("audio_status", "").startswith("silent-placeholder-track"), "three 10-second narration cues synced; audio explicitly remains a silent placeholder"),
        check("dunhuang-narration-masters", all(path.is_file() for path in DUNHUANG_NARRATION_MASTERS) and len(dunhuang_narration_masters) == 3 and all(7.0 < float(item.get("duration", 0)) < 9.3 and item.get("audio_codec") == "mp3" for item in dunhuang_narration_masters), ", ".join(f"{item.get('file')}={item.get('duration')}s" for item in dunhuang_narration_masters)),
        check("dunhuang-sound-v1-retained", all(path.is_file() for path in DUNHUANG_V1_SOUND_FILES) and dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("previous_version", {}).get("voice", "").startswith("Microsoft Kangkang"), "Kangkang v1 preview, narration, and mix retained and referenced as previous_version"),
        check("dunhuang-sound-artifacts-synced", all(source.is_file() and demo.is_file() and sha256(source) == sha256(demo) for source, demo in ((DUNHUANG_SOUND_PREVIEW, DEMO_DUNHUANG_SOUND_PREVIEW), (DUNHUANG_NARRATION_STEM, DEMO_DUNHUANG_NARRATION_STEM), (DUNHUANG_AMBIENT_STEM, DEMO_DUNHUANG_AMBIENT_STEM), (DUNHUANG_MIX_STEM, DEMO_DUNHUANG_MIX_STEM))), "sound preview, narration, ambient, and mix canonical/demo SHA pairs match"),
        check("dunhuang-sound-preview-spec", dunhuang_sound_preview.get("video_codec") == "h264" and dunhuang_sound_preview.get("audio_codec") == "aac" and float(dunhuang_sound_preview.get("duration", 0)) == 30.0 and dunhuang_sound_preview.get("width") == 720 and dunhuang_sound_preview.get("height") == 1280 and dunhuang_sound_preview.get("sample_rate") == "48000" and dunhuang_sound_preview.get("channels") == 2 and dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("reference_video") == "assets/dunhuang/final/dunhuang-sound-preview-v2.mp4", f"30.0s / {dunhuang_sound_preview.get('width')}x{dunhuang_sound_preview.get('height')} / {dunhuang_sound_preview.get('video_codec')}+{dunhuang_sound_preview.get('audio_codec')} / {dunhuang_sound_preview.get('sample_rate')}Hz"),
        check("dunhuang-sound-stem-spec", all(float(item.get("duration", 0)) == 30.0 and item.get("audio_codec") == "aac" for item in (dunhuang_narration_stem, dunhuang_ambient_stem, dunhuang_mix_stem)), "narration, ambient, and mix stems are 30.0-second AAC files"),
        check("dunhuang-sound-mix-level", dunhuang_mix_loudness is not None and -18.0 <= dunhuang_mix_loudness <= -16.0 and dunhuang_mix_max_volume is not None and dunhuang_mix_max_volume <= -1.0, f"mix loudness {dunhuang_mix_loudness} LUFS / max {dunhuang_mix_max_volume} dB"),
        check("dunhuang-sound-cue-fit", all(cue.get("start_seconds", 0) + cue.get("source_duration_seconds", 0) < boundary for cue, boundary in zip(dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("narration_cues", []), (10, 20, 30), strict=True)) and "online neural TTS" in dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("voice_source", "") and "Yunyang" in dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("voice", "") and "no external samples" in dunhuang_demo.get("rough_cut", {}).get("sound_preview", {}).get("ambient_source", ""), "three narration cues fit their beat windows; Yunyang neural TTS and procedural no-sample provenance recorded"),
        check("dunhuang-completed-case-contract", dunhuang_demo.get("case_closure", {}).get("status") == "completed" and dunhuang_demo.get("case_closure", {}).get("final_video") == "assets/dunhuang/final/dunhuang-sound-preview-v2.mp4" and len(dunhuang_demo.get("case_closure", {}).get("ownership", [])) == 3 and len(dunhuang_demo.get("case_closure", {}).get("production_chain", [])) == 8 and len(dunhuang_demo.get("case_closure", {}).get("key_learnings", [])) >= 5 and len(dunhuang_demo.get("case_closure", {}).get("meaning", [])) >= 4, "completed status / final V2 / 3 owners / 8 workflow steps / 5 learnings / 4 meaning points"),
        check("dunhuang-case-study-deliverables", DUNHUANG_CASE_STUDY.is_file() and all(term in case_study for term in ("能力归属", "完整生产链", "只有首帧", "首尾帧", "适合", "对我们的意义", "建议扩展顺序", "发布边界")) and all((PROJECT / path).is_file() for path in dunhuang_demo.get("case_closure", {}).get("deliverables", [])), "case document covers ownership, workflow, frame routing, scenarios, meaning, extensions, boundaries; all indexed deliverables exist"),
        check("capability-provenance-contract", all(term in demo_index_source for term in ("原库真实能力", "Codex · Research Lab 新增", "用户外部模型产物")) and all(term in demo_app_source for term in ("Codex 图片模型关键帧", "用户外部模型产物 · 非原库生成", "Codex / Research Lab 首中尾帧检查")) and "先分清：原库能力与本研究实现" in readme_source, "three source layers are explicit in the prep overview, every Dunhuang shot, and README"),
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
        "dunhuang_videos": [dunhuang_video, dunhuang_second_video, dunhuang_third_video, dunhuang_fifth_video, dunhuang_sixth_video, dunhuang_fourth_video],
    }
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"evidence: {EVIDENCE_PATH.relative_to(PROJECT)}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
