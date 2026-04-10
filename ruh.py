#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
?? RUH: THE SOUL ENGINE v3.0-ETERNAL
Istanbul Urban Intelligence & Doctrine Interface
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

# UI Master Elements
GLITCH_BORDER = "X" + "="*70 + "X"
SOUL_BANNER = f"""
{GLITCH_BORDER}
    ⚡ RUH v3.0: THE SOUL ENGINE ⚡
    "Ruhun Şehirleşmiş Hali - The Eternal Matrix"
{GLITCH_BORDER}
"""

def load_matrix():
    try:
        with open(MATRIX_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Matrix synchronization failure at {MATRIX_PATH}")
        sys.exit(1)

def stream_text(text, delay=0.01):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def display_insight(m):
    print(f"\n[LAYER: {m['layer'].upper()}] [MOOD: {m['mood'].upper()}]")
    stream_text(f"📜 {m['content']}", 0.02)
    print(f"   - [Strat: {m['strat']}/10] [Depth: {m['depth']}/10] [Cat: {m['category']}]")
    print("-" * 72)

def main():
    parser = argparse.ArgumentParser(description="Istanbul Ruh Engine v3.0")
    parser.add_argument('--oracle', action='store_true', help='Access the Eternal Matrix for a random insight')
    parser.add_argument('--analyze', type=str, help='Analyze the city by mood frequency')
    parser.add_argument('--derive', action='store_true', help='Generate a Sovereign Psychogeographical Route')
    
    args = parser.parse_args()
    data = load_matrix()
    matrix = data['matrix']

    print(SOUL_BANNER)

    if args.oracle:
        display_insight(random.choice(matrix))
    elif args.analyze:
        results = [m for m in matrix if args.analyze.lower() in m['mood'].lower()]
        if results:
            print(f"Analyzing mood: {args.analyze} | Found {len(results)} nodes.\n")
            for m in results:
                display_insight(m)
        else:
            print(f"No nodes found for: {args.analyze}")
    elif args.derive:
        print("🏙️ Initializing Sovereign Dérive Route Intelligence...")
        time.sleep(1)
        nodes = random.sample(matrix, 3)
        print("\nROUTE COMMAND:")
        for i, n in enumerate(nodes):
            print(f"  POINT {i+1}: {n['layer']} -> {n['content'][:50]}...")
        print("\n⚡ WARNING: Route may lead to deep 'Sessiz Cehennem' zones.")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
