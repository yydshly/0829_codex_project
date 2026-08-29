"""Build the self-contained static research demo from canonical data and upstream thumbnails."""

from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
UPSTREAM = PROJECT / "upstream"
SOURCE_DATA = PROJECT / "data" / "research-data.json"
ASSET_DIR = PROJECT / "demo" / "assets"
GENERATED_MEDIA = PROJECT / "media" / "dunhuang"
GENERATED_VIDEO = GENERATED_MEDIA / "video"
GENERATED_FINAL = GENERATED_MEDIA / "final"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    subprocess.run([sys.executable, str(PROJECT / "scripts" / "build_preproduction.py")], check=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    data_target = ASSET_DIR / "research-data.json"
    shutil.copy2(SOURCE_DATA, data_target)

    thumb_source = UPSTREAM / "assets" / "thumbs"
    copied = []
    for source in sorted(thumb_source.glob("*.jpg")):
        target = ASSET_DIR / source.name
        shutil.copy2(source, target)
        copied.append(target.name)

    license_target = ASSET_DIR / "LICENSE-upstream.txt"
    shutil.copy2(UPSTREAM / "LICENSE", license_target)

    keyframe_target = ASSET_DIR / "dunhuang"
    keyframe_target.mkdir(parents=True, exist_ok=True)
    keyframes = []
    for source in sorted(GENERATED_MEDIA.glob("*.png")):
        target = keyframe_target / source.name
        shutil.copy2(source, target)
        keyframes.append(target.name)

    video_target = keyframe_target / "video"
    video_target.mkdir(parents=True, exist_ok=True)
    generated_videos = []
    for source in sorted(GENERATED_VIDEO.glob("*.mp4")):
        target = video_target / source.name
        shutil.copy2(source, target)
        generated_videos.append(target.name)

    final_target = keyframe_target / "final"
    final_target.mkdir(parents=True, exist_ok=True)
    final_artifacts = []
    for source in sorted(path for path in GENERATED_FINAL.glob("*") if path.is_file()):
        target = final_target / source.name
        shutil.copy2(source, target)
        final_artifacts.append(target.name)

    print(f"synced data: {data_target.relative_to(PROJECT)}")
    print(f"data sha256: {digest(data_target)}")
    print(f"synced upstream thumbnails: {', '.join(copied)}")
    print(f"synced Dunhuang keyframes: {', '.join(keyframes)}")
    print(f"synced Dunhuang videos: {', '.join(generated_videos) or 'none'}")
    print(f"synced Dunhuang final artifacts: {', '.join(final_artifacts) or 'none'}")
    print(f"synced license: {license_target.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()
