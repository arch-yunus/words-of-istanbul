#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
?? Words of Istanbul: Intelligence CLI (v2.0.0-SOVEREIGN)
Enhanced Data-Processing & Intelligence Engine
"""

import json
import random
import argparse
import sys
import os
import webbrowser
import http.server
import socketserver
import threading
from datetime import datetime

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_PATH = os.path.join(BASE_DIR, 'archive', 'quotes.json')

# UI Elements
BORDER = "???" + "="*60 + "???"
BANNER = f"""
{BORDER}
    ?? WORDS OF ISTANBUL: SOVEREIGN CORE v2.0.0 ??
    High-Density Intelligence & Urban Analysis
{BORDER}
"""

def load_data():
    try:
        with open(ARCHIVE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Archive not found at {ARCHIVE_PATH}")
        sys.exit(1)

def display_quote(quote):
    print(f"\n?? {quote['content']}")
    print(f"   ? {quote['author']} | [{quote['category']}]")
    print(f"   ? Mood: {quote['mood']} | Impact: {quote.get('impact_factor', 'N/A')}")
    print(f"   ? [Strategic: {quote['strategic_value']}/10] [Psychological: {quote['psychological_weight']}/10]")
    print("-" * 66)

def show_stats(data):
    quotes = data['quotes']
    total = len(quotes)
    categories = {}
    moods = {}
    avg_strat = sum(q['strategic_value'] for q in quotes) / total
    
    for q in quotes:
        categories[q['category']] = categories.get(q['category'], 0) + 1
        moods[q['mood']] = moods.get(q['mood'], 0) + 1
        
    print("\n?? INTELLIGENCE METRICS")
    print(f"Total Insight Density: {total}")
    print(f"Average Strategic Value: {avg_strat:.2f}/10")
    print("\n?? Category Distribution:")
    for cat, count in categories.items():
        print(f"  - {cat}: {count}")
    print("\n?? Mood Frequency:")
    for mood, count in moods.items():
        print(f"  - {mood}: {count}")
    print(f"\n{BORDER}")

def export_data(data):
    export_path = os.path.join(BASE_DIR, 'istanbul_export.txt')
    with open(export_path, 'w', encoding='utf-8') as f:
        f.write(BANNER + "\n")
        f.write(f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*66 + "\n\n")
        for q in data['quotes']:
            f.write(f"[{q['category']}] - {q['author']}\n")
            f.write(f"Content: {q['content']}\n")
            f.write(f"Strategic Value: {q['strategic_value']}/10 | Psychological Weight: {q['psychological_weight']}/10\n")
            f.write("-" * 40 + "\n\n")
    print(f"?? Intelligence export completed: {export_path}")

def launch_dashboard():
    port = 8000
    dashboard_dir = os.path.join(BASE_DIR, 'dashboard')
    os.chdir(BASE_DIR) # Ensure we are in root for path ../archive/ to work
    
    handler = http.server.SimpleHTTPRequestHandler
    
    print(f"?? Launching Intelligence Dashboard on http://localhost:{port}/dashboard/")
    print("?? Press Ctrl+C to stop the server.")
    
    # Run server in a thread so it doesn't block (though here it's fine)
    with socketserver.TCPServer(("", port), handler) as httpd:
        webbrowser.open(f"http://localhost:{port}/dashboard/index.html")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n?? Server stopped.")
            httpd.shutdown()

def main():
    parser = argparse.ArgumentParser(description="Istanbul Intelligence Engine CLI")
    parser.add_argument('-r', '--random', action='store_true', help='Display a random Masterclass insight')
    parser.add_argument('-s', '--search', type=str, help='Search insights by mood or category')
    parser.add_argument('--stats', action='store_true', help='Show intelligence distribution statistics')
    parser.add_argument('--export', action='store_true', help='Export intelligence archive to text file')
    parser.add_argument('--web', action='store_true', help='Launch the Sovereign Intelligence Dashboard')
    
    args = parser.parse_args()
    data = load_data()
    quotes = data['quotes']

    print(BANNER)

    if args.random:
        display_quote(random.choice(quotes))
    elif args.search:
        results = [q for q in quotes if args.search.lower() in q['mood'].lower() or args.search.lower() in q['category'].lower()]
        if results:
            print(f"Found {len(results)} matches for: {args.search}\n")
            for q in results:
                display_quote(q)
        else:
            print(f"No insights found for: {args.search}")
    elif args.stats:
        show_stats(data)
    elif args.export:
        export_data(data)
    elif args.web:
        launch_dashboard()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
