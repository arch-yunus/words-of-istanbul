#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🏙️ RUH: THE SOUL ENGINE v4.0-SOVEREIGN
Istanbul Urban Intelligence & Doctrine Interface
"A Sovereign-S6 Grade Knowledge Matrix"
"""

import json
import random
import argparse
import sys
import os
import time

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MATRIX_PATH = os.path.join(BASE_DIR, 'archive', 'matrix.json')

# UI Master Elements (Premium Noir Aesthetic)
GLITCH_BORDER = "X" + "="*70 + "X"
SOUL_BANNER = f"""
{GLITCH_BORDER}
    ⚡ RUH v4.0: THE SOUL ENGINE [SOVEREIGN EDITION] ⚡
    "Ruhun Şehirleşmiş Hali — The Eternal Matrix"
{GLITCH_BORDER}
"""

def load_matrix():
    try:
        with open(MATRIX_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Matrix synchronization failure at {MATRIX_PATH}")
        sys.exit(1)

def stream_text(text, delay=0.03):
    """Slow-stream for deep immersion."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def display_insight(m, immersive=True):
    print(f"\n[LAYER: {m['layer'].upper()}] [MOOD: {m['mood'].upper()}]")
    content = f"📜 {m['content']}"
    if immersive:
        stream_text(content)
    else:
        print(content)
    print(f"   ∟ [Strategy: {m['strat']}/10] [Depth: {m['depth']}/10] [Category: {m['category']}]")
    print("-" * 72)

def main():
    parser = argparse.ArgumentParser(description="Istanbul Ruh Engine v4.0")
    parser.add_argument('--oracle', action='store_true', help='Access the Eternal Matrix for a random insight')
    parser.add_argument('--link', type=str, help='Neural link: Find nodes related to a specific mood or layer')
    parser.add_argument('--derive', action='store_true', help='Generate a Sovereign Psychogeographical Route')
    parser.add_argument('--doctrine', action='store_true', help='Output high-level Urban Strategy insights')
    
    args = parser.parse_args()
    data = load_matrix()
    matrix = data['matrix']

    print(SOUL_BANNER)

    if args.oracle:
        print("👁️  Synchronizing with the Eternal Matrix...")
        time.sleep(1)
        display_insight(random.choice(matrix))

    elif args.link:
        query = args.link.lower()
        results = [m for m in matrix if query in m['mood'].lower() or query in m['layer'].lower()]
        if results:
            print(f"🔗 Neural Link established for: '{args.link}' | Found {len(results)} connections.")
            for m in results:
                display_insight(m, immersive=False)
        else:
            print(f"❌ Neural Link failed: No data for '{args.link}'")

    elif args.derive:
        print("🏙️  Initializing Sovereign Dérive Route Intelligence...")
        time.sleep(1)
        nodes = random.sample(matrix, 3)
        print("\nROUTE COMMAND (Psychogeographical Sequence):")
        for i, n in enumerate(nodes):
            print(f"  STEP {i+1}: [{n['layer'].upper()}] — {n['content'][:70]}...")
            time.sleep(0.5)
        print("\n⚡ WARNING: Route overlaps with 'Sessiz Cehennem' quadrants. Maintain operational sovereignty.")

    elif args.doctrine:
        print("🧠 THE URBAN DOCTRINE (v4.0 Alpha Preview)")
        print("-" * 72)
        stream_text("1. İstanbul bir şehir değil, bir 'olma' biçimidir.", 0.05)
        stream_text("2. Kentsel morfoloji, kolektif hafızanın fiziksel tezahürüdür.", 0.05)
        stream_text("3. Hüzün, bir zayıflık değil, kentsel bir savunma mekanizmasıdır.", 0.05)
        print("-" * 72)

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
