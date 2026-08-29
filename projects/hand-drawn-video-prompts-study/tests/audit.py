"""Audit the upstream Skill contract, local demo output, and bundled media.

The script deliberately uses only the Python standard library. It writes a
machine-readable evidence file and exits non-zero only when the local demo no
longer satisfies the current upstream prompt contract. Observed upstream
documentation drift is reported separately and does not make reproduction
fail.
"""

from __future__ import annotations

import json
import math
import shutil
import struct
import subprocess
import zlib
from collections import Counter
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
UPSTREAM = PROJECT / "upstream"
CASE_PATH = PROJECT / "data" / "demo-case.json"
EVIDENCE_PATH = PROJECT / "notes" / "evidence" / "audit-results.json"
TARGET_RGB = (0xF8, 0xF6, 0xEF)
GENERATED_FRAMES = [
    PROJECT / "demo" / "assets" / f"news-shot-{index:02d}-generated.png"
    for index in range(1, 8)
]
FINAL_VIDEO = PROJECT / "demo" / "assets" / "news-case-final.mp4"
FINAL_SUBTITLES = PROJECT / "media" / "news-case.srt"
FINAL_VOICEOVER = PROJECT / "media" / "news-case-voiceover.m4a"


def run(*args: str) -> str:
    return subprocess.check_output(args, cwd=PROJECT, text=True).strip()


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def decode_png(path: Path) -> tuple[int, int, int, bytes]:
    """Decode an 8-bit, non-interlaced RGB/RGBA PNG using stdlib only."""
    payload = path.read_bytes()
    if payload[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")

    offset = 8
    idat = bytearray()
    width = height = bit_depth = color_type = interlace = 0
    while offset < len(payload):
        length = struct.unpack(">I", payload[offset : offset + 4])[0]
        kind = payload[offset + 4 : offset + 8]
        data = payload[offset + 8 : offset + 8 + length]
        offset += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(
                ">IIBBBBB", data
            )
        elif kind == b"IDAT":
            idat.extend(data)
        elif kind == b"IEND":
            break

    channels = {2: 3, 6: 4}.get(color_type)
    if bit_depth != 8 or channels is None or interlace != 0:
        raise ValueError(
            f"Unsupported PNG format: depth={bit_depth}, color={color_type}, "
            f"interlace={interlace}"
        )

    raw = zlib.decompress(bytes(idat))
    stride = width * channels
    previous = bytearray(stride)
    decoded = bytearray(width * height * channels)
    cursor = 0
    target = 0
    for _ in range(height):
        filter_type = raw[cursor]
        cursor += 1
        scan = bytearray(raw[cursor : cursor + stride])
        cursor += stride
        for index in range(stride):
            left = scan[index - channels] if index >= channels else 0
            up = previous[index]
            upper_left = previous[index - channels] if index >= channels else 0
            if filter_type == 1:
                scan[index] = (scan[index] + left) & 0xFF
            elif filter_type == 2:
                scan[index] = (scan[index] + up) & 0xFF
            elif filter_type == 3:
                scan[index] = (scan[index] + ((left + up) // 2)) & 0xFF
            elif filter_type == 4:
                scan[index] = (scan[index] + paeth(left, up, upper_left)) & 0xFF
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter: {filter_type}")
        decoded[target : target + stride] = scan
        target += stride
        previous = scan
    return width, height, channels, bytes(decoded)


def inspect_png(path: Path) -> dict[str, object]:
    width, height, channels, pixels = decode_png(path)
    samples: list[tuple[int, int, int]] = []
    for y in range(0, max(1, height // 5), 24):
        for x in range(0, width, 24):
            offset = (y * width + x) * channels
            samples.append(tuple(pixels[offset : offset + 3]))  # type: ignore[arg-type]

    means = tuple(round(sum(rgb[i] for rgb in samples) / len(samples), 2) for i in range(3))
    distances = [
        math.sqrt(sum((rgb[i] - TARGET_RGB[i]) ** 2 for i in range(3)))
        for rgb in samples
    ]
    exact = sum(rgb == TARGET_RGB for rgb in samples)
    return {
        "file": path.name,
        "width": width,
        "height": height,
        "aspect_ratio": round(width / height, 6),
        "aspect_error_percent_vs_9_16": round(
            abs(width / height - 9 / 16) / (9 / 16) * 100, 4
        ),
        "top_band_sample_count": len(samples),
        "top_band_mean_rgb": means,
        "exact_f8f6ef_fraction": round(exact / len(samples), 6),
        "mean_rgb_distance_from_f8f6ef": round(sum(distances) / len(distances), 2),
    }


def contains_all(value: str, fragments: list[str]) -> tuple[bool, list[str]]:
    normalized = value.lower().replace("-", " ")
    missing = [
        fragment
        for fragment in fragments
        if fragment.lower().replace("-", " ") not in normalized
    ]
    return not missing, missing


def audit_demo(case: dict[str, object]) -> list[dict[str, object]]:
    checks: list[dict[str, object]] = []
    shots = case["shots"]
    assert isinstance(shots, list)
    image_fragments = [
        "vertical 9:16",
        "#f8f6ef",
        "sunflower yellow",
        "cobalt blue",
        "tomato red",
        "bottom 15%",
        "no",
    ]
    video_fragments = [
        "vertical 9:16",
        "locked flat frontal camera",
        "rigid flat paper cutout",
        "tactile 10–12 fps paper stop-motion",
        "no camera drift",
        "0.8 seconds",
        "no audio",
    ]
    for shot in shots:
        assert isinstance(shot, dict)
        shot_id = str(shot["id"])
        duration = int(shot["duration_seconds"])
        checks.append(
            {
                "id": f"shot-{shot_id}-duration",
                "pass": 4 <= duration <= 6,
                "evidence": f"{duration} seconds; expected 4–6",
            }
        )
        for field, fragments in (
            ("image_prompt", image_fragments),
            ("video_prompt", video_fragments),
        ):
            ok, missing = contains_all(str(shot[field]), fragments)
            checks.append(
                {
                    "id": f"shot-{shot_id}-{field}",
                    "pass": ok,
                    "evidence": "all contract fragments present"
                    if ok
                    else f"missing: {', '.join(missing)}",
                }
            )
        checks.append(
            {
                "id": f"shot-{shot_id}-required-fields",
                "pass": all(
                    str(shot.get(field, "")).strip()
                    for field in ("narration", "metaphor", "keyword", "entity_note")
                ),
                "evidence": "narration, metaphor, keyword, and entity note",
            }
        )
    return checks


def audit_news(case: dict[str, object]) -> list[dict[str, object]]:
    news = case.get("news")
    assert isinstance(news, dict)
    sources = news.get("sources")
    assert isinstance(sources, list)
    script = str(case.get("source_script", ""))
    shots = case.get("shots")
    assert isinstance(shots, list)
    final_shot = shots[-1]
    assert isinstance(final_shot, dict)
    official_hosts = {"www.cas.cn", "www.xinhuanet.com"}
    observed_hosts = {
        str(source.get("url", "")).split("/")[2]
        for source in sources
        if isinstance(source, dict) and str(source.get("url", "")).startswith("https://")
    }
    required_facts = ["超过40万公里", "1.25Mbps", "100Mbps", "8K", "12秒"]
    return [
        {
            "id": "news-source-diversity",
            "pass": official_hosts.issubset(observed_hosts),
            "evidence": f"observed official hosts: {', '.join(sorted(observed_hosts))}",
        },
        {
            "id": "news-recency-record",
            "pass": news.get("published_at") == "2026-08-28"
            and case.get("generated_at") == "2026-08-29",
            "evidence": f"published={news.get('published_at')}; generated={case.get('generated_at')}",
        },
        {
            "id": "news-facts-retained-in-script",
            "pass": all(fact in script for fact in required_facts),
            "evidence": f"required tokens: {', '.join(required_facts)}",
        },
        {
            "id": "editorial-opinion-separated",
            "pass": final_shot.get("fact_refs") == []
            and "编辑性总结" in str(final_shot.get("entity_note", "")),
            "evidence": "final editorial conclusion has no fact refs and is labeled in its risk note",
        },
        {
            "id": "all-generated-frames-recorded",
            "pass": all(path.is_file() for path in GENERATED_FRAMES)
            and all(
                isinstance(shot, dict)
                and shot.get("generated_asset")
                == f"assets/news-shot-{index:02d}-generated.png"
                for index, shot in enumerate(shots, start=1)
            ),
            "evidence": "7/7 generated frame paths are present and recorded per shot",
        },
        {
            "id": "final-deliverables-recorded",
            "pass": FINAL_VIDEO.is_file()
            and FINAL_SUBTITLES.is_file()
            and FINAL_VOICEOVER.is_file()
            and isinstance(case.get("final_video"), dict)
            and case["final_video"].get("video_model_used") is False,
            "evidence": "MP4, SRT, voiceover and explicit no-video-model boundary",
        },
        {
            "id": "subtitle-timeline-complete",
            "pass": FINAL_SUBTITLES.is_file()
            and FINAL_SUBTITLES.read_text(encoding="utf-8").count(" --> ") == 7,
            "evidence": "7 subtitle cues for 7 shots",
        },
    ]


def inspect_video(path: Path) -> dict[str, object]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return {"file": path.name, "status": "ffprobe unavailable"}
    output = subprocess.check_output(
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
    data = json.loads(output)
    return {"file": path.name, "status": "inspected", **data}


def main() -> None:
    case = json.loads(CASE_PATH.read_text(encoding="utf-8"))
    skill = (UPSTREAM / "hand-drawn-video-prompts" / "SKILL.md").read_text(
        encoding="utf-8"
    )
    skill_zh = (UPSTREAM / "hand-drawn-video-prompts" / "SKILL.zh-CN.md").read_text(
        encoding="utf-8"
    )
    example = (
        UPSTREAM / "hand-drawn-video-prompts" / "references" / "output-example.md"
    ).read_text(encoding="utf-8")
    style = (
        UPSTREAM / "hand-drawn-video-prompts" / "references" / "style-guide.md"
    ).read_text(encoding="utf-8")
    automation = (
        UPSTREAM / "hand-drawn-video-prompts" / "references" / "automation-workflow.md"
    ).read_text(encoding="utf-8")
    old_prompts = (UPSTREAM / "outputs" / "flow-nano-q-doodle-prompts.md").read_text(
        encoding="utf-8"
    )

    demo_checks = audit_demo(case)
    news_checks = audit_news(case)
    files = [path for path in UPSTREAM.rglob("*") if path.is_file() and ".git" not in path.parts]
    suffixes = Counter(path.suffix or "[none]" for path in files)
    code_suffixes = {".py", ".js", ".ts", ".tsx", ".sh", ".ps1", ".go", ".rs"}
    repo_facts = {
        "commit": run("git", "-C", str(UPSTREAM), "rev-parse", "HEAD"),
        "commit_count": int(run("git", "-C", str(UPSTREAM), "rev-list", "--count", "HEAD")),
        "file_count": len(files),
        "file_types": dict(sorted(suffixes.items())),
        "executable_source_file_count": sum(path.suffix in code_suffixes for path in files),
        "bundled_test_file_count": sum("test" in path.parts for path in files),
    }
    drift = [
        {
            "id": "visual-group-count",
            "observed": "3–5 large visual groups" in example and "two to four" in skill.lower(),
            "evidence": "Current SKILL.md says two to four groups; output-example.md still asks for 3–5.",
        },
        {
            "id": "character-proportion",
            "observed": "large head and tiny body" in old_prompts.lower()
            and "do not use giant heads, tiny bodies" in skill.lower(),
            "evidence": "Older public output asks for large head/tiny body; current SKILL.md forbids it.",
        },
        {
            "id": "keyword-placement-mode",
            "observed": "默认把每个镜头的中文关键词直接纳入画面设计" in skill_zh
            and "关键词只作为后期文字层，不写进生成画面" in automation,
            "evidence": "Prompt mode defaults to embedded short keywords; complete-video workflow routes keywords to post-production.",
        },
        {
            "id": "blank-first-frame-vs-fixed-keyword",
            "observed": "completely blank" in style.lower()
            and "fixed and legible" in skill.lower(),
            "evidence": "A completely blank First Frame and an on-image keyword fixed throughout the shot cannot both be literal without a separate overlay rule.",
        },
    ]

    png_results = [inspect_png(path) for path in sorted((UPSTREAM / "outputs").glob("*.png"))]
    video_results = [
        inspect_video(path) for path in sorted((UPSTREAM / "demo").glob("*.mp4"))
    ]
    generated_frame_results = [inspect_png(path) for path in GENERATED_FRAMES]
    final_video_result = inspect_video(FINAL_VIDEO)
    final_streams = final_video_result.get("streams", [])
    video_stream = next(
        (
            stream
            for stream in final_streams
            if isinstance(stream, dict) and stream.get("codec_type") == "video"
        ),
        {},
    )
    audio_stream = next(
        (
            stream
            for stream in final_streams
            if isinstance(stream, dict) and stream.get("codec_type") == "audio"
        ),
        {},
    )
    final_format = final_video_result.get("format", {})
    final_duration = float(final_format.get("duration", 0)) if isinstance(final_format, dict) else 0
    news_checks.append(
        {
            "id": "final-video-media-contract",
            "pass": video_stream.get("codec_name") == "h264"
            and video_stream.get("width") == 1080
            and video_stream.get("height") == 1920
            and video_stream.get("r_frame_rate") == "20/1"
            and audio_stream.get("codec_name") == "aac"
            and 40.9 <= final_duration <= 41.2,
            "evidence": "H.264/AAC, 1080x1920, 20fps, approximately 41.02s",
        }
    )
    failed = [check for check in demo_checks if not check["pass"]]
    failed_news = [check for check in news_checks if not check["pass"]]
    report = {
        "generated_at": "2026-08-29",
        "target_background": "#F8F6EF",
        "summary": {
            "demo_contract_checks": len(demo_checks),
            "demo_contract_failures": len(failed),
            "news_provenance_checks": len(news_checks),
            "news_provenance_failures": len(failed_news),
            "upstream_drift_observations": sum(item["observed"] for item in drift),
            "png_assets_inspected": len(png_results),
            "video_assets_inspected": len(video_results),
            "generated_frames_inspected": len(generated_frame_results),
            "final_video_inspected": final_video_result.get("status") == "inspected",
        },
        "repository": repo_facts,
        "demo_checks": demo_checks,
        "news_checks": news_checks,
        "documentation_drift": drift,
        "png_assets": png_results,
        "video_assets": video_results,
        "generated_frames": generated_frame_results,
        "final_video": final_video_result,
    }
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"evidence: {EVIDENCE_PATH.relative_to(PROJECT)}")
    if failed or failed_news:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
