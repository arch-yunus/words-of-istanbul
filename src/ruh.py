#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🏙️ RUH: THE SOUL ENGINE v5.0-OMEGA
Integrated Urban Intelligence System
"A Sovereign-S6 Grade Knowledge Ecosystem"
"""

import json
import random
import argparse
import sys
import os
import time
import glob

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATRIX_PATH = os.path.join(BASE_DIR, 'archive', 'matrix.json')
VAULT_DIR = os.path.join(BASE_DIR, 'vault')

# UI Master Elements (Omega Noir Aesthetic)
GLITCH_BORDER = "X" + "="*70 + "X"
SOUL_BANNER = f"""
{GLITCH_BORDER}
    ⚡ RUH v5.0: THE SOUL ENGINE [OMEGA EDITION] ⚡
    "Integrated Urban Intelligence Ecosystem"
{GLITCH_BORDER}
"""

def load_matrix():
    try:
        with open(MATRIX_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Matrix synchronization failure at {MATRIX_PATH}")
        sys.exit(1)

def stream_text(text, delay=0.02):
    """Slow-stream for deep immersion."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def display_insight(m, immersive=True):
    impact_stars = "★" * m.get('impact', 5) + "☆" * (10 - m.get('impact', 5))
    print(f"\n[LAYER: {m['layer'].upper()}] [MOOD: {m['mood'].upper()}] [IMPACT: {impact_stars}]")
    content = f"📜 {m['content']}"
    if immersive:
        stream_text(content)
    else:
        print(content)
    print(f"   ∟ [Strategy: {m['strat']}/10] [Depth: {m['depth']}/10] [Category: {m['category']}]")
    print("-" * 72)

def main():
    parser = argparse.ArgumentParser(description="Istanbul Ruh Engine v5.0-OMEGA")
    parser.add_argument('--oracle', action='store_true', help='Access the Eternal Matrix for a random insight')
    parser.add_argument('--scan', type=str, help='Deep scan across matrix and vault for a keyword')
    parser.add_argument('--monitor', action='store_true', help='Real-time Urban State Monitoring (Dashboard)')
    parser.add_argument('--derive', action='store_true', help='Generate a Sovereign Psychogeographical Route')
    
    args = parser.parse_args()
    data = load_matrix()
    matrix = data['matrix']

    print(SOUL_BANNER)

    if args.oracle:
        print("👁️  Synchronizing with the Omega Matrix...")
        time.sleep(1)
        display_insight(random.choice(matrix))

    elif args.scan:
        query = args.scan.lower()
        print(f"🔍 Initializing Deep Scan for: '{query}'...")
        time.sleep(1)
        
        # Search Matrix
        matrix_matches = [m for m in matrix if query in m['content'].lower() or query in m['mood'].lower()]
        
        # Search Vault
        vault_matches = []
        if os.path.exists(VAULT_DIR):
            for file in glob.glob(os.path.join(VAULT_DIR, "*.md")):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        if query in f.read().lower():
                            vault_matches.append(os.path.basename(file))
                except:
                    pass

        if matrix_matches or vault_matches:
            print(f"✅ Scan Complete. Found {len(matrix_matches)} matrix nodes and {len(vault_matches)} vault modules.")
            if vault_matches:
                print(f"📂 Vault Modules: {', '.join(vault_matches)}")
            for m in matrix_matches:
                display_insight(m, immersive=False)
        else:
            print(f"❌ Scan failed: No intelligence found for '{query}'")

    elif args.monitor:
        print("📊 [SYSTEM: MONITORING URBAN METRICS...]")
        time.sleep(1)
        avg_impact = sum(m.get('impact', 5) for m in matrix) / len(matrix)
        moods = [m['mood'] for m in matrix]
        dominant_mood = max(set(moods), key=moods.count)
        
        print(f"  ∟ [CITY_SOUL_INDEX: {avg_impact:.2f}/10]")
        print(f"  ∟ [DOMINANT_MOOD: {dominant_mood.upper()}]")
        print(f"  ∟ [MATRIX_DENSITY: {len(matrix)} active nodes]")
        print("-" * 72)
        print("CURRENT DOCTRINE STREAM:")
        for _ in range(3):
            m = random.choice(matrix)
            print(f"  [!] {m['content'][:75]}...")
            time.sleep(0.5)

    elif args.derive:
        print("🏙️  Initializing Sovereign Dérive Route Intelligence...")
        time.sleep(1)
        nodes = random.sample(matrix, 3)
        print("\nROUTE COMMAND (Omega Psychogeographical Sequence):")
        for i, n in enumerate(nodes):
            print(f"  STEP {i+1}: [{n['layer'].upper()}] — {n['content'][:70]}...")
            time.sleep(0.5)
        print("\n⚡ WARNING: Sovereign parameters met. Route is active.")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
