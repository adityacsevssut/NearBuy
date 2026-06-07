import shutil
import os

source_dir = r"C:\Users\ADITYA KUMAR NAHAK\.gemini\antigravity-ide\brain\bf7d99da-7d93-4817-8b2b-b3efcce50482"
dest_dir = r"d:\Git Repo NearBuy\NearBuy\frontend\public"

mapping = {
    "bakery_dark_1780768030328.png": "bakery_cake_and_hotdog_dark.png",
    "drinks_dark_1780768042929.png": "drinks_blue_mojito_dark.png",
    "chole_bhature_dark_1780768056845.png": "chole_bhature_dark.png",
    "samosa_dark_1780768068798.png": "samosa_gemini_dark.png",
    "others_dark_1780768081881.png": "others_gemini_dark.png"
}

for src_name, dest_name in mapping.items():
    src_path = os.path.join(source_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_name} to {dest_name}")
    else:
        print(f"NOT FOUND: {src_path}")
