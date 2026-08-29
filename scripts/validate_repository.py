"""Validate repository structure, project metadata, and generated indexes."""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

from catalog import ROOT, STATUS_LABELS, expected_readme, load_catalog


SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
REQUIRED_FIELDS = {
    "id",
    "title",
    "summary",
    "status",
    "path",
    "source_url",
    "demo_url",
    "tags",
    "created",
    "updated",
}


def validate_date(value: object, field: str, project_id: str, errors: list[str]) -> date | None:
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        errors.append(f"{project_id}: {field} 必须是 YYYY-MM-DD 日期")
        return None


def validate_url(value: object, field: str, project_id: str, errors: list[str]) -> None:
    if value and not isinstance(value, str):
        errors.append(f"{project_id}: {field} 必须是字符串")
    elif value and not value.startswith("https://"):
        errors.append(f"{project_id}: {field} 必须为空或使用 https:// 地址")


def validate_project(project: Any, seen: set[str], errors: list[str]) -> None:
    if not isinstance(project, dict):
        errors.append("catalog 中的每个项目必须是 JSON 对象")
        return

    missing = REQUIRED_FIELDS - project.keys()
    if missing:
        errors.append(f"项目缺少字段：{', '.join(sorted(missing))}")
        return

    project_id = str(project["id"])
    if not SLUG_PATTERN.fullmatch(project_id):
        errors.append(f"{project_id}: 项目 ID 格式无效")
    if project_id in seen:
        errors.append(f"{project_id}: 项目 ID 重复")
    seen.add(project_id)

    for field in ("title", "summary"):
        if not isinstance(project[field], str) or not project[field].strip():
            errors.append(f"{project_id}: {field} 不能为空")
    if project["status"] not in STATUS_LABELS:
        errors.append(f"{project_id}: 未知状态 {project['status']!r}")
    if project["path"] != f"projects/{project_id}":
        errors.append(f"{project_id}: path 必须是 projects/{project_id}")
    if not isinstance(project["tags"], list) or not all(
        isinstance(tag, str) and tag.strip() for tag in project["tags"]
    ):
        errors.append(f"{project_id}: tags 必须是非空字符串数组（允许空数组）")
    elif project["tags"] != sorted(set(project["tags"])):
        errors.append(f"{project_id}: tags 必须去重并按字母排序")

    validate_url(project["source_url"], "source_url", project_id, errors)
    validate_url(project["demo_url"], "demo_url", project_id, errors)
    created = validate_date(project["created"], "created", project_id, errors)
    updated = validate_date(project["updated"], "updated", project_id, errors)
    if created and updated and updated < created:
        errors.append(f"{project_id}: updated 不能早于 created")

    project_dir = ROOT / "projects" / project_id
    readme_path = project_dir / "README.md"
    metadata_path = project_dir / "project.json"
    if not project_dir.is_dir():
        errors.append(f"{project_id}: 缺少目录 projects/{project_id}")
        return
    if not readme_path.is_file():
        errors.append(f"{project_id}: 缺少项目 README.md")
    if not metadata_path.is_file():
        errors.append(f"{project_id}: 缺少 project.json")
        return

    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        errors.append(f"{project_id}: project.json 无法读取：{exc}")
        return
    if metadata != project:
        errors.append(f"{project_id}: project.json 与 projects/catalog.json 不一致")


def validate() -> list[str]:
    errors: list[str] = []
    try:
        catalog = load_catalog()
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        return [f"无法读取 projects/catalog.json：{exc}"]

    if not isinstance(catalog, dict) or catalog.get("version") != 1:
        errors.append("catalog.version 必须是 1")
    projects = catalog.get("projects")
    if not isinstance(projects, list):
        return errors + ["catalog.projects 必须是数组"]

    seen: set[str] = set()
    for project in projects:
        validate_project(project, seen, errors)

    registered = {project["id"] for project in projects if isinstance(project, dict) and "id" in project}
    project_root = ROOT / "projects"
    actual = {path.name for path in project_root.iterdir() if path.is_dir()}
    for directory in sorted(actual - registered):
        errors.append(f"projects/{directory}: 目录存在但未登记到 catalog")

    try:
        current_readme = (ROOT / "README.md").read_text(encoding="utf-8")
        if current_readme != expected_readme(catalog, current_readme):
            errors.append("根 README 的项目表与 catalog 不一致；请用创建脚本更新")
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        errors.append(f"无法校验根 README：{exc}")

    for relative_path in ("docs/index.html", "docs/app.js", "docs/styles.css"):
        if not (ROOT / relative_path).is_file():
            errors.append(f"缺少展示站点文件：{relative_path}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("仓库校验失败：")
        for error in errors:
            print(f"  - {error}")
        return 1
    catalog = load_catalog()
    print(f"仓库校验通过：{len(catalog['projects'])} 个研究项目。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
