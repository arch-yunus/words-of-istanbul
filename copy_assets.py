#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Copy optional image assets into ./assets (portable; no machine-specific paths)."""

from __future__ import annotations

import argparse
import os
import shutil
import sys


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Copy named files from SOURCE_DIR into repo assets/ with optional renames."
    )
    parser.add_argument(
        "source_dir",
        help="Directory containing source image files",
    )
    parser.add_argument(
        "--dest",
        default="assets",
        help="Destination directory under repo root (default: assets)",
    )
    parser.add_argument(
        "--map",
        nargs="*",
        metavar="SRC=DEST",
        default=[],
        help="Rename map entries, e.g. photo1.png=banner.png",
    )
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    dest_dir = os.path.join(root, args.dest)
    os.makedirs(dest_dir, exist_ok=True)

    mapping: dict[str, str] = {}
    for item in args.map:
        if "=" not in item:
            print(f"Invalid --map entry (use SRC=DEST): {item}", file=sys.stderr)
            return 2
        src_name, dest_name = item.split("=", 1)
        mapping[src_name.strip()] = dest_name.strip()

    if not mapping:
        print(
            "No --map given. Example:\n"
            "  python copy_assets.py /path/to/images "
            "--map istanbul.png=banner.png galata.png=galata_noir.png",
            file=sys.stderr,
        )
        return 2

    ok = 0
    for src_name, dest_name in mapping.items():
        src_path = os.path.join(args.source_dir, src_name)
        dest_path = os.path.join(dest_dir, dest_name)
        try:
            shutil.copy2(src_path, dest_path)
            print(f"OK: {src_name} -> {dest_path}")
            ok += 1
        except OSError as e:
            print(f"FAIL: {src_name}: {e}", file=sys.stderr)

    return 0 if ok == len(mapping) else 1


if __name__ == "__main__":
    raise SystemExit(main())
