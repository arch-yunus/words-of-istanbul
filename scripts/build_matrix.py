#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build archive/corpus.json and archive/matrix.json from pillar essays."""

from __future__ import annotations

import json
import os
import re
from datetime import date

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVE = os.path.join(BASE, "archive")
PILLAR_GLOBS = ("01_*", "02_*", "03_*", "04_*", "05_*")

PILLAR_META = {
    "01": ("Psikoloji", "Hüzün", 8),
    "02": ("İmparatorluk", "Güç", 9),
    "03": ("Edebiyat", "Şiir", 9),
    "04": ("Şehir", "Gündelik", 7),
    "05": ("Mitoloji", "Efsane", 9),
}


def pillar_key(dirname: str) -> str:
    return dirname[:2] if len(dirname) >= 2 else "00"


def slug_from_path(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def title_from_md(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("#"):
            return re.sub(r"^#+\s*", "", line).strip()
    return "Untitled"


def extract_blockquotes(text: str) -> list[str]:
    quotes: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith(">"):
            q = re.sub(r"^>\s*", "", s).strip()
            q = q.strip("*").strip()
            if q and not q.startswith("—"):
                quotes.append(q)
    return quotes


def fallback_sentence(text: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("-") or s.startswith("*"):
            continue
        if s.startswith(">"):
            continue
        if len(s) > 40:
            return s[:220] + ("…" if len(s) > 220 else "")
    return "İstanbul'un bu katmanında sessiz bir hikâye bekliyor."


def collect_essays() -> list[dict]:
    essays: list[dict] = []
    for pattern in PILLAR_GLOBS:
        for root in sorted(glob_dirs(pattern)):
            for name in sorted(os.listdir(root)):
                if not name.endswith(".md"):
                    continue
                rel = os.path.join(os.path.basename(root), name).replace("\\", "/")
                path = os.path.join(root, name)
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
                pk = pillar_key(os.path.basename(root))
                layer, mood, base_impact = PILLAR_META.get(pk, ("Genel", "Belirsiz", 7))
                essays.append(
                    {
                        "id": slug_from_path(name),
                        "path": rel,
                        "title": title_from_md(text),
                        "pillar": os.path.basename(root),
                        "layer": layer,
                        "mood": mood,
                    }
                )
    return essays


def glob_dirs(pattern: str) -> list[str]:
    import glob

    return [p for p in glob.glob(os.path.join(BASE, pattern)) if os.path.isdir(p)]


def build_matrix(essays: list[dict]) -> list[dict]:
    nodes: list[dict] = []
    n = 0
    for essay in essays:
        path = os.path.join(BASE, essay["path"].replace("/", os.sep))
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        quotes = extract_blockquotes(text)
        if not quotes:
            quotes = [fallback_sentence(text)]
        pk = pillar_key(essay["pillar"])
        layer, mood, base = PILLAR_META.get(pk, ("Genel", "Belirsiz", 7))
        for i, content in enumerate(quotes[:3]):
            n += 1
            depth = min(10, base + (1 if len(content) > 80 else 0))
            nodes.append(
                {
                    "id": f"n{n}",
                    "source": essay["path"],
                    "essay_id": essay["id"],
                    "layer": layer,
                    "content": content,
                    "category": essay["title"][:48],
                    "mood": mood,
                    "strat": min(10, base),
                    "depth": depth,
                    "impact": min(10, base + (1 if i == 0 else 0)),
                }
            )
    return nodes


def main() -> None:
    os.makedirs(ARCHIVE, exist_ok=True)
    essays = collect_essays()
    matrix = build_matrix(essays)
    corpus = {
        "version": "6.0.0-RESURRECTION",
        "metadata": {
            "project": "Words of Istanbul",
            "essays": len(essays),
            "matrix_nodes": len(matrix),
            "last_sync": date.today().isoformat(),
        },
        "essays": essays,
    }
    data = {
        "version": "6.0.0-RESURRECTION",
        "metadata": {
            "project": "Words of Istanbul",
            "total_insights": len(matrix),
            "essays": len(essays),
            "last_sync": date.today().isoformat(),
        },
        "matrix": matrix,
    }
    with open(os.path.join(ARCHIVE, "corpus.json"), "w", encoding="utf-8") as f:
        json.dump(corpus, f, ensure_ascii=False, indent=2)
    with open(os.path.join(ARCHIVE, "matrix.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Built {len(essays)} essays, {len(matrix)} matrix nodes.")


if __name__ == "__main__":
    main()
