"""Build the dependency-free static GitHub Pages site."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone

from catalog import CATALOG_PATH, ROOT


SOURCE_DIR = ROOT / "docs"
OUTPUT_DIR = ROOT / ".site"


def main() -> None:
    if OUTPUT_DIR.parent != ROOT or OUTPUT_DIR.name != ".site":
        raise RuntimeError("拒绝清理非预期的站点输出目录")
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    shutil.copytree(SOURCE_DIR, OUTPUT_DIR)
    shutil.copy2(CATALOG_PATH, OUTPUT_DIR / "projects.json")
    (OUTPUT_DIR / "build.json").write_text(
        json.dumps(
            {"built_at": datetime.now(timezone.utc).isoformat()},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"站点已构建：{OUTPUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
