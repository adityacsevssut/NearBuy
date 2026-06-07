const Jimp = require('jimp');
const fs = require('fs');

async function removeWhiteBg(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    
    // Scan all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red   = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue  = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // If pixel is very close to white, make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0
      }
    });

    await image.writeAsync(outputPath);
    console.log('Processed:', outputPath);
  } catch (err) {
    console.error('Error processing', inputPath, err);
  }
}

const files = [
  'biryani_gemini.png', 'roll.png', 'dosa.png', 'chowmin_gemini.png', 'momo_gemini.png',
  'pizza_gemini.png', 'burger_gemini.png', 'chicken_pakoda.png', 'vada.png', 'manchurian.png',
  'bakery_cake_and_hotdog.png', 'drinks_blue_mojito.png', 'chole_bhature.png', 'samosa_gemini.png', 'others_gemini.png'
];

async function run() {
  for (const file of files) {
    if (fs.existsSync(`public/${file}`)) {
      await removeWhiteBg(`public/${file}`, `public/${file.replace('.png', '_dark.png')}`);
    }
  }
}

run();
