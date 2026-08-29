"""Shared helpers for the research project catalog."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "projects" / "catalog.json"
README_PATH = ROOT / "README.md"
PROJECTS_START = "<!-- PROJECTS:START -->"
PROJECTS_END = "<!-- PROJECTS:END -->"

STATUS_LABELS = {
    "planned": "计划中",
    "active": "进行中",
    "paused": "暂停",
    "completed": "已完成",
    "archived": "已归档",
}


def load_catalog() -> dict[str, Any]:
    """Load the canonical project catalog."""
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def save_catalog(catalog: dict[str, Any]) -> None:
    """Write the canonical project catalog using stable formatting."""
    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def markdown_cell(value: object) -> str:
    """Escape a value for a compact Markdown table cell."""
    return str(value).replace("|", "\\|").replace("\n", " ").strip()


def render_projects_table(projects: list[dict[str, Any]]) -> str:
    """Render the generated section of the root README."""
    lines = [
        "| 子项目 | 研究问题 | 状态 | 在线展示 | 最近更新 |",
        "| --- | --- | --- | --- | --- |",
    ]
    if not projects:
        lines.append("| 暂无项目 | 使用下方命令创建第一个研究项目 | — | — | — |")
        return "\n".join(lines)

    for project in sorted(projects, key=lambda item: item["id"]):
        title = markdown_cell(project["title"])
        path = markdown_cell(project["path"])
        summary = markdown_cell(project["summary"])
        status = STATUS_LABELS.get(project["status"], project["status"])
        demo_url = str(project.get("demo_url", "")).strip()
        demo = f"[打开演示]({demo_url})" if demo_url else "—"
        updated = markdown_cell(project["updated"])
        lines.append(
            f"| [{title}]({path}/) | {summary} | {status} | {demo} | {updated} |"
        )
    return "\n".join(lines)


def expected_readme(catalog: dict[str, Any], current: str | None = None) -> str:
    """Return README content with its generated project table refreshed."""
    content = current if current is not None else README_PATH.read_text(encoding="utf-8")
    if content.count(PROJECTS_START) != 1 or content.count(PROJECTS_END) != 1:
        raise ValueError("README 中的项目索引标记缺失或重复")
    before, remainder = content.split(PROJECTS_START, 1)
    _, after = remainder.split(PROJECTS_END, 1)
    table = render_projects_table(catalog["projects"])
    return f"{before}{PROJECTS_START}\n{table}\n{PROJECTS_END}{after}"


def update_readme(catalog: dict[str, Any]) -> None:
    """Refresh the generated project table in the root README."""
    README_PATH.write_text(expected_readme(catalog), encoding="utf-8")
