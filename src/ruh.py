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


def run_interactive() -> None:
    import subprocess
    while True:
        os.system("cls" if os.name == "nt" else "clear")
        print("\033[1;33m" + SOUL_BANNER + "\033[0m")
        print("\033[1;36m  --- [ İNTERAKTİF ŞEHİR PORTALI ] ---\033[0m")
        print("  [1] Oracle (Günün Kahini) - Anlık İçgörü")
        print("  [2] Dérive (Rastgele Rota) - 3 Duraklı Yürüyüş")
        print("  [3] Scan (Arama) - Matrix & Corpus Keşfi")
        print("  [4] Monitor (Şehir Durumu) - Canlı Göstergeler")
        print("  [5] Stats (Metrikler) - Veri Analizi")
        print("  [6] Corpus (Kütüphane) - Denemeleri Oku")
        print("  [7] Gözlem Ekle (Yeni Kayıt) - Şehri Sen Yaz")
        print("  [0] Çıkış\n")
        
        choice = input("\033[1;32m  Seçiminiz [0-7]: \033[0m").strip()
        
        if choice == "0":
            print("\n  Güle güle, İstanbul seni bekler...")
            break
        elif choice == "1":
            os.system("cls" if os.name == "nt" else "clear")
            print("\033[1;33m🔮 İSTANBUL'UN KAHİNİ (ORACLE) 🔮\033[0m\n")
            matrix = load_matrix()["matrix"]
            if matrix:
                display_insight(random.choice(matrix), immersive=True)
            else:
                print("  Matrix boş.")
            input("\n  Devam etmek için [Enter]'a basın...")
        elif choice == "2":
            os.system("cls" if os.name == "nt" else "clear")
            print("\033[1;36m🚶 DÉRIVE — PSİKOMİTOLOJİK ROTA 🚶\033[0m\n")
            matrix = load_matrix()["matrix"]
            if len(matrix) >= 3:
                route = random.sample(matrix, 3)
                for i, node in enumerate(route, 1):
                    print(f"\n\033[1;33m📍 Durak {i}/3: {node['layer'].upper()} ({node['mood']})\033[0m")
                    print(f"   ∟ Kategori: {node['category']}")
                    stream_text(f"   📜 \"{node['content']}\"")
                    print(f"   ∟ Kaynak: {node['source']}")
                    if i < 3:
                        cmd = input("\n  Sonraki durak için [Enter]'a basın (veya çıkmak için 'q'): ").strip().lower()
                        if cmd == 'q':
                            break
                else:
                    print("\n\033[1;32m✨ Rota başarıyla tamamlandı. Şehri hisset.\033[0m")
            else:
                print("  Yeterli düğüm yok.")
            input("\n  Ana menüye dönmek için [Enter]'a basın...")
        elif choice == "3":
            os.system("cls" if os.name == "nt" else "clear")
            print("\033[1;35m🔍 MATRİX VE CORPUS ARAMASI 🔍\033[0m\n")
            q = input("  Aranacak kelime: ").strip()
            if q:
                matrix = load_matrix()["matrix"]
                mh = [m for m in matrix if matrix_matches(m, q)]
                ch = search_corpus(q)
                print(f"\n  ✅ {len(mh)} matrix düğümü, {len(ch)} corpus dosyası bulundu.\n")
                if ch:
                    print("\033[1;36m  📂 Corpus Eşleşmeleri:\033[0m")
                    for rel, ex in ch:
                        print(f"     • {rel}: {ex}")
                if mh:
                    print("\n\033[1;33m  📜 Matrix Eşleşmeleri:\033[0m")
                    for m in mh:
                        display_insight(m, immersive=False)
                if not mh and not ch:
                    print("  ❌ Eşleşme bulunamadı.")
            input("\n  Devam etmek için [Enter]'a basın...")
        elif choice == "4":
            os.system("cls" if os.name == "nt" else "clear")
            print("\033[1;32m⚡ ŞEHİR RUHU MONITORÜ ⚡\033[0m\n")
            matrix = load_matrix()["matrix"]
            if matrix:
                avg = sum(m.get("impact", 5) for m in matrix) / len(matrix)
                moods = [m["mood"] for m in matrix]
                dom_mood = max(set(moods), key=moods.count).upper()
                print(f"  📊 ŞEHİR SOUL INDEX  : {avg:.2f}/10")
                print(f"  🎭 BASKIN DUYGU HALİ : {dom_mood}")
                print(f"  🕸️ TOPLAM DÜĞÜM      : {len(matrix)}")
                print(f"  📚 CORPUS DENEME     : {len(iter_corpus_md())}")
                print("\n  --- SON EKLENEN İÇGÖRÜLERDEN ESİNTİLER ---")
                for _ in range(min(3, len(matrix))):
                    print(f"  • \"{random.choice(matrix)['content'][:75]}...\"")
            else:
                print("  Veri bulunamadı.")
            input("\n  Devam etmek için [Enter]'a basın...")
        elif choice == "5":
            os.system("cls" if os.name == "nt" else "clear")
            matrix = load_matrix()["matrix"]
            print_stats(matrix)
            input("\n  Devam etmek için [Enter]'a basın...")
        elif choice == "6":
            while True:
                os.system("cls" if os.name == "nt" else "clear")
                print("\033[1;33m📚 ŞEHİR KÜTÜPHANESİ 📚\033[0m\n")
                corpus_data = load_json(CORPUS_PATH)
                essays = corpus_data.get("essays", [])
                for idx, e in enumerate(essays, 1):
                    print(f"  [{idx:02d}] {e['title']} ({e['layer']})")
                print("  [00] Ana Menüye Dön\n")
                sub = input("  Okumak istediğiniz deneme no: ").strip()
                if sub == "0" or sub == "00":
                    break
                try:
                    e_idx = int(sub) - 1
                    if 0 <= e_idx < len(essays):
                        selected = essays[e_idx]
                        os.system("cls" if os.name == "nt" else "clear")
                        print("\033[1;36m" + "="*72 + "\033[0m")
                        read_essay(selected["id"])
                        print("\033[1;36m" + "="*72 + "\033[0m")
                        input("\n  Kütüphaneye dönmek için [Enter]'a basın...")
                    else:
                        print("  Geçersiz numara.")
                        time.sleep(1)
                except ValueError:
                    print("  Lütfen bir sayı girin.")
                    time.sleep(1)
        elif choice == "7":
            os.system("cls" if os.name == "nt" else "clear")
            print("\033[1;33m✍️ YENİ ŞEHİR GÖZLEMİ EKLE ✍️\033[0m\n")
            quote = input("  İstanbul gözleminizi/sözünüzü yazın:\n  > ").strip()
            if not quote:
                print("  Boş gözlem eklenemez.")
                time.sleep(1.5)
                continue
            
            print("\n  Bu gözlem hangi tarihsel/kültürel katmana ait?")
            print("  [1] Psikoloji (Hüzün, kimlik, melankoli)")
            print("  [2] İmparatorluk (Tarih, saray, diplomasi)")
            print("  [3] Edebiyat (Şiir, seyyahlar, divan)")
            print("  [4] Şehir (Gündelik hayat, kediler, sesler)")
            print("  [5] Mitoloji (Efsaneler, tılsımlar, kadim sırlar)")
            
            l_choice = input("  Seçiminiz [1-5]: ").strip()
            layers_map = {
                "1": ("01_psikoloji-ve-huzun", "Psikoloji"),
                "2": ("02_imparatorluklar-ve-siyaset", "İmparatorluk"),
                "3": ("03_edebiyat-ve-siir", "Edebiyat"),
                "4": ("04_sehrin-sesleri-ve-yuzleri", "Şehir"),
                "5": ("05_mitoloji-ve-efsaneler", "Mitoloji")
            }
            
            p_dir, layer_name = layers_map.get(l_choice, ("04_sehrin-sesleri-ve-yuzleri", "Şehir"))
            
            mood = input("\n  Hissedilen Duygu/Ruh Hali (örn: Hüzün, Güç, Şiir, Gündelik, Efsane): ").strip()
            if not mood:
                mood = "Belirsiz"
                
            target_file_name = "kullanici-gozlemleri.md"
            target_path = os.path.join(BASE_DIR, p_dir, target_file_name)
            exists = os.path.isfile(target_path)
            
            try:
                with open(target_path, "a", encoding="utf-8") as f:
                    if not exists:
                        f.write(f"# ✍️ Kullanıcı Gözlemleri: {layer_name}\n\n")
                        f.write(f"Kullanıcılar tarafından eklenen anlık İstanbul {layer_name.lower()} kayıtları.\n\n")
                    f.write(f"## Gözlem Kaydı ({time.strftime('%Y-%m-%d %H:%M')})\n\n")
                    f.write(f"> *{quote}*\n\n")
                    f.write(f"- **Katman**: {layer_name}\n")
                    f.write(f"- **Duygu**: {mood}\n\n")
                    f.write("---\n\n")
                
                print("\n  ⌛ Matrix yeniden derleniyor...")
                script = os.path.join(BASE_DIR, "scripts", "build_matrix.py")
                subprocess.check_call([sys.executable, script])
                print("\n\033[1;32m  ✓ Kayıt başarıyla eklendi ve Matrix güncellendi!\033[0m")
            except Exception as e:
                print(f"  ❌ Hata oluştu: {e}")
            
            input("\n  Devam etmek için [Enter]'a basın...")


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
    parser.add_argument(
        "-i",
        "--interactive",
        action="store_true",
        help="İnteraktif terminal arayüzünü başlat",
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

    has_action = (args.oracle or args.scan or args.monitor or args.derive or 
                  args.stats or args.corpus or args.read or args.validate or 
                  args.serve is not None)

    if args.interactive or not has_action:
        run_interactive()
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

if __name__ == "__main__":
    main()
