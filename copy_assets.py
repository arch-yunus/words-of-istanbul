import shutil
import os

source_dir = r"C:\Users\bahat\.gemini\antigravity\brain\7f875831-fab9-4ed0-99d5-92af55ea16c9"
dest_dir = r"g:\Diğer bilgisayarlar\Dizüstü Bilgisayarım\github repolarım\words-of-istanbul\assets"

files = {
    "istanbul_twilight_bosphorus_1775884077801.png": "twilight_bosphorus.png",
    "galata_tower_noir_rain_1775884092419.png": "galata_noir.png",
    "hagia_sophia_mystical_matrix_1775884105477.png": "hagia_sophia_matrix.png"
}

for src, dest in files.items():
    src_path = os.path.join(source_dir, src)
    dest_path = os.path.join(dest_dir, dest)
    try:
        shutil.copy2(src_path, dest_path)
        print(f"Successfully copied {src} to {dest}")
    except Exception as e:
        print(f"Failed to copy {src}: {e}")
