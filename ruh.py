#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compatibility entrypoint: delegates to src/ruh.py (Soul Engine v5.0-OMEGA)."""

import os
import runpy
import sys


def main() -> None:
    root = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(root, "src", "ruh.py")
    if not os.path.isfile(target):
        print(f"Error: Expected engine at {target}")
        sys.exit(1)
    sys.argv[0] = target
    runpy.run_path(target, run_name="__main__")


if __name__ == "__main__":
    main()
