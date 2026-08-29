"""Build the dependency-free static GitHub Pages site."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from catalog import CATALOG_PATH, ROOT


SOURCE_DIR = ROOT / "docs"
OUTPUT_DIR = ROOT / ".site"


def copy_project_demos(catalog: dict[str, object]) -> list[Path]:
    """Publish registered project demos under predictable Pages subpaths."""
    copied: list[Path] = []
    for project in catalog.get("projects", []):
        if not isinstance(project, dict) or not project.get("demo_url"):
            continue

        project_id = str(project["id"])
        project_root = (ROOT / str(project["path"])).resolve()
        expected_root = (ROOT / "projects" / project_id).resolve()
        if project_root != expected_root:
            raise RuntimeError(f"项目路径与 ID 不匹配：{project_id}")

        demo_source = project_root / "demo"
        if not demo_source.is_dir():
            raise RuntimeError(f"项目声明了 demo_url 但缺少 demo 目录：{project_id}")
        for required in ("index.html", "styles.css", "app.js"):
            if not (demo_source / required).is_file():
                raise RuntimeError(f"项目演示缺少 {required}：{project_id}")

        demo_target = OUTPUT_DIR / "projects" / project_id
        demo_target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(demo_source, demo_target)
        copied.append(demo_target.relative_to(OUTPUT_DIR))
    return copied


def main() -> None:
    if OUTPUT_DIR.parent != ROOT or OUTPUT_DIR.name != ".site":
        raise RuntimeError("拒绝清理非预期的站点输出目录")
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    shutil.copytree(SOURCE_DIR, OUTPUT_DIR)

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    shutil.copy2(CATALOG_PATH, OUTPUT_DIR / "projects.json")
    demos = copy_project_demos(catalog)
    (OUTPUT_DIR / "build.json").write_text(
        json.dumps(
            {
                "built_at": datetime.now(timezone.utc).isoformat(),
                "project_demos": [path.as_posix() for path in demos],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"站点已构建：{OUTPUT_DIR.relative_to(ROOT)}，项目演示 {len(demos)} 个")


if __name__ == "__main__":
    main()
