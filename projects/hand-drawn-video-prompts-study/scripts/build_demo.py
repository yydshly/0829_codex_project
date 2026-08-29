"""Copy canonical research data into the self-contained static demo."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
SYNC_PAIRS = (
    (
        PROJECT / "data" / "demo-case.json",
        PROJECT / "demo" / "assets" / "demo-case.json",
    ),
    (
        PROJECT / "data" / "i2v-agent-workflow-storyboard.json",
        PROJECT / "demo" / "assets" / "i2v-agent-workflow-storyboard.json",
    ),
)
PROMPT_PACK_TARGET = (
    PROJECT / "demo" / "assets" / "i2v-agent-workflow-30s-prompts.txt"
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render_i2v_prompt_pack(storyboard_path: Path) -> str:
    storyboard = json.loads(storyboard_path.read_text(encoding="utf-8"))
    status = storyboard.get("status", {})
    ready = int(status.get("paired_videos_ready", 0))
    pending = int(status.get("paired_videos_pending", 5))
    lines = [
        "AI AGENT 整理任务｜30 秒首尾帧图生视频生产包",
        "画幅：9:16 竖屏",
        "结构：5 镜头 × 6 秒",
        f"当前状态：5/5 首帧就绪，5/5 尾帧就绪，{ready}/5 新首尾帧视频完成，{pending}/5 待生成",
        "历史边界：既有 i2v-agent-workflow.mp4 是镜头 04 的单图实验，不是新首尾帧合同的结果。",
        "",
        "统一使用方式",
        "1. 选择“首尾帧/起止帧图生视频”，不要选择单图首帧或全能文生视频。",
        "2. FIRST 上传为首帧，LAST 上传为尾帧；不要颠倒。",
        "3. 每条时长设为 6 秒，竖屏 9:16，关闭自动配乐、自动字幕、智能扩写和预设运镜。",
        "4. 创意度使用低到中，提示词遵循与主体保持使用高；只粘贴对应镜头 Prompt。",
        "5. 输出依次命名为 i2v-agent-workflow-shot-01.mp4 至 shot-05.mp4。",
        "",
    ]
    for shot in storyboard["shots"]:
        lines.extend(
            [
                f"SHOT {shot['id']}｜{shot['title']}",
                f"FIRST：{Path(shot['first_frame_asset']).name}",
                f"LAST：{Path(shot['last_frame_asset']).name}",
                f"首帧状态：{shot['start_state']}",
                f"尾帧状态：{shot['end_state']}",
                f"旁白：{shot['narration']}",
                "PROMPT:",
                shot["video_prompt"],
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    for source, target in SYNC_PAIRS:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        print(f"synced: {target.relative_to(PROJECT)}")
        print(f"sha256: {digest(target)}")
    PROMPT_PACK_TARGET.write_text(
        render_i2v_prompt_pack(PROJECT / "data" / "i2v-agent-workflow-storyboard.json"),
        encoding="utf-8",
    )
    print(f"rendered: {PROMPT_PACK_TARGET.relative_to(PROJECT)}")
    print(f"sha256: {digest(PROMPT_PACK_TARGET)}")


if __name__ == "__main__":
    main()
