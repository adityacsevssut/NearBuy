import shutil
import os

source_dir = r"C:\Users\ADITYA KUMAR NAHAK\.gemini\antigravity-ide\brain\bf7d99da-7d93-4817-8b2b-b3efcce50482"
dest_dir = r"d:\Git Repo NearBuy\NearBuy\frontend\public"

mapping = {
    "biryani_dark_1780767723849.png": "biryani_gemini_dark.png",
    "roll_dark_1780767735268.png": "roll_dark.png",
    "dosa_dark_1780767748353.png": "dosa_dark.png",
    "chowmin_dark_1780767761462.png": "chowmin_gemini_dark.png",
    "momo_dark_1780767773903.png": "momo_gemini_dark.png",
    "pizza_dark_1780767807470.png": "pizza_gemini_dark.png",
    "burger_dark_1780767821012.png": "burger_gemini_dark.png",
    "chicken_pakoda_dark_1780767834262.png": "chicken_pakoda_dark.png",
    "vada_dark_1780767845987.png": "vada_dark.png",
    "manchurian_dark_1780767862252.png": "manchurian_dark.png"
}

for src_name, dest_name in mapping.items():
    src_path = os.path.join(source_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_name} to {dest_name}")
    else:
        print(f"NOT FOUND: {src_path}")
