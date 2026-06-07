import os
from PIL import Image

files = [
    'biryani_gemini.png', 'roll.png', 'dosa.png', 'chowmin_gemini.png', 'momo_gemini.png',
    'pizza_gemini.png', 'burger_gemini.png', 'chicken_pakoda.png', 'vada.png', 'manchurian.png',
    'bakery_cake_and_hotdog.png', 'drinks_blue_mojito.png', 'chole_bhature.png', 'samosa_gemini.png', 'others_gemini.png'
]

def make_dark_bg(filepath, outpath):
    try:
        img = Image.open(filepath).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # item is (R, G, B, A)
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                # Replace near-white with transparent
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(outpath, "PNG")
        print(f"Processed {filepath} -> {outpath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for f in files:
    in_path = os.path.join('public', f)
    if os.path.exists(in_path):
        out_path = os.path.join('public', f.replace('.png', '_dark.png'))
        make_dark_bg(in_path, out_path)
