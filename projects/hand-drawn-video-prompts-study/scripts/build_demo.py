"""Copy canonical research data into the self-contained static demo."""

from __future__ import annotations

import hashlib
import shutil
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "data" / "demo-case.json"
TARGET = PROJECT / "demo" / "assets" / "demo-case.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, TARGET)
    print(f"synced: {TARGET.relative_to(PROJECT)}")
    print(f"sha256: {digest(TARGET)}")


if __name__ == "__main__":
    main()
