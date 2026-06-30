const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function processImage(inputPath, outputPath) {
    try {
        console.log(`Processing ${inputPath}...`);
        const fileUri = 'file://' + inputPath.replace(/\\/g, '/');
        const blob = await removeBackground(fileUri);
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved transparent image to ${outputPath}`);
    } catch (e) {
        console.error(`Error processing ${inputPath}:`, e);
    }
}

async function main() {
    const images = ['promo_pizza', 'promo_burger', 'promo_biryani', 'promo_roll', 'promo_momo', 'promo_sandwich'];
    
    for (const name of images) {
        const inputPath = path.join(__dirname, 'public', `${name}.png`);
        const outputPath = path.join(__dirname, 'public', `${name}_transparent.png`);
        
        if (fs.existsSync(inputPath)) {
            await processImage(inputPath, outputPath);
        } else {
            console.log(`File not found: ${inputPath}`);
        }
    }
    console.log("All done!");
}

main();
