"""Normalize upstream beats examples into a provider-neutral preproduction library."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
UPSTREAM = PROJECT / "upstream"
DATA_TARGET = PROJECT / "data" / "preproduction-data.json"
DEMO_TARGET = PROJECT / "demo" / "assets" / "preproduction-data.json"
DEMONSTRATION_SOURCE = PROJECT / "data" / "dunhuang-demo.json"

SOURCES = [
    ("money-15s", "15 秒三段式", "examples/money-15s.beats.json"),
    ("tang-30s", "30 秒时间线", "examples/tang-30s.beats.json"),
    ("money-60s", "60 秒解释型", "examples/money-60s-9x16-english.beats.json"),
    ("ronaldo", "人物生涯节点", "examples/ronaldo-9x16-kling.beats.json"),
]


def normalized_shots(beat: dict, beat_index: int) -> list[dict]:
    shots = beat.get("shots") or [beat]
    normalized = []
    for shot_index, shot in enumerate(shots, start=1):
        shot_id = f"B{beat_index:02d}-S{shot_index:02d}"
        scene = shot.get("scene") or beat.get("scene") or beat.get("narration", "")
        motion_parts = [
            shot.get("motion") or beat.get("motion", ""),
            shot.get("camera_move", ""),
            shot.get("element_motion", ""),
        ]
        motion = "; ".join(part for part in motion_parts if part)
        upstream_still = shot.get("keyframe_prompt", "")
        normalized.append(
            {
                "id": shot_id,
                "duration": shot.get("dur") or beat.get("dur") or 5,
                "scene": scene,
                "still_prompt": upstream_still or scene,
                "still_prompt_source": "upstream" if upstream_still else "derived-from-scene",
                "motion_prompt": motion or "subtle camera movement; preserve subject, layout, text and identity",
                "reference_image": shot.get("keyframe_url") or beat.get("keyframe_url") or "",
                "reference_video": shot.get("clip_url") or beat.get("clip_url") or "",
            }
        )
    return normalized


def normalize(source_id: str, label: str, relative_path: str) -> dict:
    source_path = UPSTREAM / relative_path
    doc = json.loads(source_path.read_text(encoding="utf-8"))
    beats = []
    for index, beat in enumerate(doc.get("beats", []), start=1):
        shots = normalized_shots(beat, index)
        beats.append(
            {
                "id": f"B{index:02d}",
                "title": beat.get("title_cn") or beat.get("title_en") or f"Beat {index}",
                "narration": beat.get("narration", ""),
                "background": beat.get("bg", ""),
                "feel": beat.get("feel", ""),
                "shots": shots,
            }
        )
    shot_count = sum(len(beat["shots"]) for beat in beats)
    duration = sum(float(shot["duration"]) for beat in beats for shot in beat["shots"])
    return {
        "id": source_id,
        "label": label,
        "project": doc.get("project", source_id),
        "topic": doc.get("topic", ""),
        "language": doc.get("language", "unknown"),
        "aspect": doc.get("aspect", "unknown"),
        "style": doc.get("style", "unknown"),
        "arc": doc.get("arc") or "upstream-not-recorded",
        "upstream_model": doc.get("video_model") or "upstream-not-recorded",
        "source_file": relative_path,
        "beat_count": len(beats),
        "shot_count": shot_count,
        "timeline_seconds": round(duration, 2),
        "beats": beats,
    }


def build() -> dict:
    demonstration = json.loads(DEMONSTRATION_SOURCE.read_text(encoding="utf-8"))
    return {
        "schema": "research-lab.preproduction-pack/v1",
        "generated_from_commit": "668ec3946fe0139bc985313b15c1a300fca42f94",
        "notice": "上游样例提供结构参考；修改主题后必须人工重写和核验逐镜头内容。",
        "routes": [
            {
                "id": "image-to-video",
                "name": "关键帧 → 视频",
                "best_for": "已有图片模型，视频模型支持首帧或参考图",
                "required": ["still_prompt", "reference_image", "motion_prompt", "duration", "aspect"],
                "optional": ["negative_prompt", "seed", "end_frame"],
            },
            {
                "id": "text-to-video",
                "name": "文本 → 视频",
                "best_for": "没有关键帧模型，直接按镜头生成",
                "required": ["scene", "motion_prompt", "duration", "aspect"],
                "optional": ["negative_prompt", "reference_image", "seed"],
            },
            {
                "id": "first-last-frame",
                "name": "首尾帧 → 视频",
                "best_for": "需要明确构图变化或转场终点",
                "required": ["reference_image", "end_frame", "motion_prompt", "duration", "aspect"],
                "optional": ["negative_prompt", "seed"],
            },
            {
                "id": "reference-to-video",
                "name": "参考素材 → 视频",
                "best_for": "人物、产品或品牌主体需要保持一致",
                "required": ["reference_image", "scene", "motion_prompt", "duration", "aspect"],
                "optional": ["reference_video", "identity_notes", "negative_prompt"],
            },
        ],
        "human_gates": [
            {"id": "facts", "label": "事实与数字已核验"},
            {"id": "rights", "label": "人物、声音、Logo 与素材权利已确认"},
            {"id": "text", "label": "中文、数字和 Logo 改为后期确定性叠加"},
            {"id": "identity", "label": "人物/产品锚点逐镜头复核"},
            {"id": "continuity", "label": "相邻镜头构图、色彩与主体连续"},
            {"id": "audio", "label": "旁白时长、字幕和镜头时长对齐"},
        ],
        "demonstrations": [demonstration],
        "samples": [normalize(*item) for item in SOURCES],
    }


def main() -> None:
    payload = build()
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    for target in (DATA_TARGET, DEMO_TARGET):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(serialized, encoding="utf-8")
    print(
        f"normalized {len(payload['samples'])} samples, "
        f"{sum(item['beat_count'] for item in payload['samples'])} beats, "
        f"{sum(item['shot_count'] for item in payload['samples'])} shots"
    )


if __name__ == "__main__":
    main()
