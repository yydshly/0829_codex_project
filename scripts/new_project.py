"""Create a research project and register it in the repository index."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

from catalog import ROOT, load_catalog, save_catalog, update_readme


SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TEMPLATE_DIR = ROOT / "templates" / "research-project"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="创建研究项目，并同步 catalog 与根 README 索引。"
    )
    parser.add_argument("project_id", help="小写英文、数字和连字符组成的项目 ID")
    parser.add_argument("title", help="面向读者的项目标题")
    parser.add_argument("--summary", required=True, help="一句话研究问题或目标")
    parser.add_argument("--tag", action="append", default=[], help="项目标签，可重复使用")
    parser.add_argument("--source-url", default="", help="研究对象或上游仓库的 HTTPS 地址")
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if not SLUG_PATTERN.fullmatch(args.project_id):
        raise SystemExit("项目 ID 只能包含小写英文、数字和单个连字符。")
    if not args.title.strip() or not args.summary.strip():
        raise SystemExit("项目标题和研究摘要不能为空。")
    if args.source_url and not args.source_url.startswith("https://"):
        raise SystemExit("--source-url 必须为空或使用 https:// 地址。")


def render_template(path: Path, replacements: dict[str, str]) -> str:
    content = path.read_text(encoding="utf-8")
    for token, value in replacements.items():
        content = content.replace("{{" + token + "}}", value)
    unresolved = re.findall(r"{{[^{}]+}}", content)
    if unresolved:
        raise RuntimeError(f"模板仍有未替换字段：{', '.join(unresolved)}")
    return content


def main() -> None:
    args = parse_args()
    validate_args(args)

    catalog = load_catalog()
    existing_ids = {project["id"] for project in catalog.get("projects", [])}
    if args.project_id in existing_ids:
        raise SystemExit(f"项目已存在：{args.project_id}")

    project_dir = ROOT / "projects" / args.project_id
    if project_dir.exists():
        raise SystemExit(f"目录已存在但未登记：{project_dir.relative_to(ROOT)}")

    today = date.today().isoformat()
    tags = sorted({tag.strip().lower() for tag in args.tag if tag.strip()})
    project = {
        "id": args.project_id,
        "title": args.title.strip(),
        "summary": args.summary.strip(),
        "status": "planned",
        "path": f"projects/{args.project_id}",
        "source_url": args.source_url.strip(),
        "demo_url": "",
        "tags": tags,
        "created": today,
        "updated": today,
    }
    replacements = {
        "id": project["id"],
        "title": project["title"],
        "summary": project["summary"],
        "date": today,
        "source_url": project["source_url"],
        "tags": json.dumps(tags, ensure_ascii=False),
    }

    project_dir.mkdir(parents=False)
    (project_dir / "README.md").write_text(
        render_template(TEMPLATE_DIR / "README.md", replacements), encoding="utf-8"
    )
    (project_dir / "project.json").write_text(
        render_template(TEMPLATE_DIR / "project.json", replacements), encoding="utf-8"
    )

    catalog["projects"].append(project)
    catalog["projects"].sort(key=lambda item: item["id"])
    save_catalog(catalog)
    update_readme(catalog)

    print(f"已创建 projects/{args.project_id}")
    print("下一步：完善项目 README，然后运行 python scripts/validate_repository.py")


if __name__ == "__main__":
    main()
