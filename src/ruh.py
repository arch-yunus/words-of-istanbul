#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🏙️ RUH — Soul Engine v6.0-RESURRECTION
Corpus-aware urban intelligence for Words of Istanbul.
"""

from __future__ import annotations

import argparse
import glob
import http.server
import json
import os
import random
import socketserver
import sys
import time
import webbrowser
from typing import Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATRIX_PATH = os.path.join(BASE_DIR, "archive", "matrix.json")
CORPUS_PATH = os.path.join(BASE_DIR, "archive", "corpus.json")
DASHBOARD_DIR = os.path.join(BASE_DIR, "dashboard")
PILLAR_DIRS = [
    os.path.join(BASE_DIR, d)
    for pattern in ("01_*", "02_*", "03_*", "04_*", "05_*")
    for d in glob.glob(os.path.join(BASE_DIR, pattern))
    if os.path.isdir(d)
]

GLITCH_BORDER = "X" + "=" * 70 + "X"
SOUL_BANNER = f"""
{GLITCH_BORDER}
    ⚡ RUH v6.0: SOUL ENGINE [RESURRECTION] ⚡
    "İstanbul'un Sözleri — Corpus & Matrix"
{GLITCH_BORDER}
"""

REQUIRED_KEYS = ("layer", "content", "category", "mood", "strat", "depth", "impact")


def _configure_stdio_utf8() -> None:
    if sys.platform == "win32":
        for stream in (sys.stdout, sys.stderr):
            try:
                stream.reconfigure(encoding="utf-8")
            except (AttributeError, OSError, ValueError):
                pass


_configure_stdio_utf8()


def load_json(path: str) -> dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: missing {path}\nRun: python scripts/build_matrix.py")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON at {path}: {e}")
        sys.exit(1)


def load_matrix() -> dict[str, Any]:
    return load_json(MATRIX_PATH)


def stream_text(text: str, delay: float = 0.02) -> None:
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()


def display_insight(m: dict[str, Any], immersive: bool = True) -> None:
    impact = max(0, min(10, int(m.get("impact", 5))))
    stars = "★" * impact + "☆" * (10 - impact)
    src = m.get("source", "")
    print(f"\n[LAYER: {m['layer'].upper()}] [MOOD: {m['mood'].upper()}] [IMPACT: {stars}]")
    if src:
        print(f"   ∟ source: {src}")
    content = f"📜 {m['content']}"
    if immersive:
        stream_text(content)
    else:
        print(content)
    print(
        f"   ∟ [Strategy: {m['strat']}/10] [Depth: {m['depth']}/10] [{m['category']}]"
    )
    print("-" * 72)


def matrix_matches(m: dict[str, Any], query: str) -> bool:
    q = query.lower()
    blob = " ".join(
        str(m.get(k, "")).lower()
        for k in ("content", "mood", "layer", "category", "id", "source", "essay_id")
    )
    return q in blob


def iter_corpus_md() -> list[str]:
    paths: list[str] = []
    for root in sorted(PILLAR_DIRS):
        for name in sorted(os.listdir(root)):
            if name.endswith(".md"):
                paths.append(os.path.join(root, name))
    return paths


def search_corpus(query: str) -> list[tuple[str, str]]:
    q = query.lower()
    hits: list[tuple[str, str]] = []
    for path in iter_corpus_md():
        try:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        except OSError:
            continue
        if q not in text.lower():
            continue
        rel = os.path.relpath(path, BASE_DIR).replace("\\", "/")
        excerpt = ""
        for line in text.splitlines():
            if q in line.lower():
                excerpt = line.strip()[:120]
                break
        hits.append((rel, excerpt or "(eşleşme)"))
    return hits


def validate_matrix(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    matrix = data.get("matrix")
    if not isinstance(matrix, list):
        return ["'matrix' must be a list"]
    for i, m in enumerate(matrix):
        if not isinstance(m, dict):
            errors.append(f"matrix[{i}] must be object")
            continue
        for key in REQUIRED_KEYS:
            if key not in m:
                errors.append(f"matrix[{i}] missing '{key}'")
    meta = data.get("metadata", {})
    if isinstance(meta, dict):
        ti = meta.get("total_insights")
        if isinstance(ti, int) and ti != len(matrix):
            errors.append(f"total_insights ({ti}) != len(matrix) ({len(matrix)})")
    return errors


def print_stats(matrix: list[dict[str, Any]]) -> None:
    n = len(matrix)
    if not n:
        print("Matrix boş.")
        return
    avg = sum(m.get("impact", 5) for m in matrix) / n
    moods = [m["mood"] for m in matrix]
    dom = max(set(moods), key=moods.count)
    layers: dict[str, int] = {}
    for m in matrix:
        layers[m["layer"]] = layers.get(m["layer"], 0) + 1
    print("📈 MATRIX İSTATİSTİKLERİ")
    print(f"  ∟ Düğüm: {n}")
    print(f"  ∟ Ortalama impact: {avg:.2f}/10")
    print(f"  ∟ Baskın mood: {dom}")
    for name, count in sorted(layers.items(), key=lambda x: -x[1])[:6]:
        print(f"      — {name}: {count}")
    print("-" * 72)


def print_corpus_list() -> None:
    data = load_json(CORPUS_PATH)
    essays = data.get("essays", [])
    print(f"📚 CORPUS — {len(essays)} deneme\n")
    current = ""
    for e in essays:
        pillar = e.get("pillar", "")
        if pillar != current:
            current = pillar
            print(f"\n## {pillar}")
        print(f"  • [{e.get('id')}] {e.get('title')}")
        print(f"    {e.get('path')}")
    print("-" * 72)


def read_essay(slug: str) -> None:
    data = load_json(CORPUS_PATH)
    for e in data.get("essays", []):
        if e.get("id") == slug or slug in e.get("path", ""):
            path = os.path.join(BASE_DIR, e["path"].replace("/", os.sep))
            with open(path, "r", encoding="utf-8") as f:
                print(f.read())
            return
    print(f"Deneme bulunamadı: {slug}")
    sys.exit(1)


def run_server(port: int, open_browser: bool) -> None:
    os.chdir(BASE_DIR)
    url = f"http://127.0.0.1:{port}/dashboard/index.html"
    with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f"Serving: {BASE_DIR}")
        print(f"Dashboard: {url}")
        if open_browser:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nDurduruldu.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Istanbul Soul Engine v6.0-RESURRECTION")
    parser.add_argument("--oracle", action="store_true", help="Rastgele matrix düğümü")
    parser.add_argument("--scan", metavar="KEY", help="Matrix + corpus araması")
    parser.add_argument("--monitor", action="store_true", help="Şehir ruhu özeti")
    parser.add_argument("--derive", action="store_true", help="3 duraklı psychogeography rotası")
    parser.add_argument("--stats", action="store_true", help="Matrix istatistikleri")
    parser.add_argument("--corpus", action="store_true", help="Tüm denemeleri listele")
    parser.add_argument("--read", metavar="SLUG", help="Deneme oku (id veya dosya adı)")
    parser.add_argument("--validate", action="store_true", help="matrix.json doğrula")
    parser.add_argument(
        "--serve",
        nargs="?",
        const=8765,
        type=int,
        metavar="PORT",
        help="Dashboard sunucusu (varsayılan 8765)",
    )
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="scripts/build_matrix.py çalıştır",
    )

    args = parser.parse_args()

    if args.rebuild:
        import subprocess

        script = os.path.join(BASE_DIR, "scripts", "build_matrix.py")
        subprocess.check_call([sys.executable, script])
        return

    if args.validate:
        errs = validate_matrix(load_matrix())
        if errs:
            for e in errs:
                print(f"  — {e}")
            sys.exit(1)
        m = load_matrix()["matrix"]
        print(f"OK: {len(m)} nodes, matrix geçerli.")
        return

    if args.corpus:
        print(SOUL_BANNER)
        print_corpus_list()
        return

    if args.read:
        read_essay(args.read.strip())
        return

    data = load_matrix()
    matrix: list[dict[str, Any]] = data["matrix"]

    if args.stats:
        print(SOUL_BANNER)
        print_stats(matrix)
        return

    if args.serve is not None:
        run_server(args.serve, open_browser=not args.no_browser)
        return

    print(SOUL_BANNER)

    if args.oracle:
        display_insight(random.choice(matrix))
    elif args.scan:
        q = args.scan.strip()
        if not q:
            sys.exit("Scan için anahtar kelime gerekli.")
        mh = [m for m in matrix if matrix_matches(m, q)]
        ch = search_corpus(q)
        print(f"✅ {len(mh)} matrix, {len(ch)} corpus dosyası.")
        for rel, ex in ch:
            print(f"   📂 {rel}: {ex}")
        for m in mh:
            display_insight(m, immersive=False)
        if not mh and not ch:
            print(f"❌ '{q}' için sonuç yok.")
    elif args.monitor:
        avg = sum(m.get("impact", 5) for m in matrix) / len(matrix)
        moods = [m["mood"] for m in matrix]
        print(f"  ∟ CITY_SOUL_INDEX: {avg:.2f}/10")
        print(f"  ∟ DOMINANT_MOOD: {max(set(moods), key=moods.count).upper()}")
        print(f"  ∟ NODES: {len(matrix)} | ESSAYS: {len(iter_corpus_md())}")
        print("-" * 72)
        for _ in range(3):
            print(f"  [!] {random.choice(matrix)['content'][:78]}…")
    elif args.derive:
        route = random.sample(matrix, min(3, len(matrix)))
        print("ROUTE (Dérive):")
        for i, n in enumerate(route, 1):
            print(f"  {i}. [{n['layer']}] {n['content'][:65]}…")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
