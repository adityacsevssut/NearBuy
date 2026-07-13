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
    const images = [
        'images/404_store_light.png',
        'images/404_error_light.png',
        'images/404_store_dark.png',
        'images/404_error_dark.png',
        'images/network_error_store.png',
        'images/network_error_food.png',
        'images/network_error_store_dark.png',
        'images/network_error_food_dark.png'
    ];
    for (const name of images) {
        const inputPath = path.join(__dirname, 'public', name);
        // Overwrite the same image with transparent one
        const outputPath = path.join(__dirname, 'public', name);
        
        if (fs.existsSync(inputPath)) {
            await processImage(inputPath, outputPath);
        } else {
            console.log(`File not found: ${inputPath}`);
        }
    }
    console.log("All done!");
}
main();
