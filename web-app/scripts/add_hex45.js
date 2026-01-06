import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

// Extract dominant color from image using color quantization
async function getDominantColor(imagePath) {
    try {
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Sample every 10th pixel for performance
        const colorCounts = {};
        for (let i = 0; i < pixels.length; i += 40) { // RGBA = 4 bytes, so 40 = every 10 pixels
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;

            // Quantize to reduce color space (group similar colors)
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;

            const key = `${qr},${qg},${qb}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Find most common color
        let maxCount = 0;
        let dominantColor = null;

        for (const [color, count] of Object.entries(colorCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        }

        if (!dominantColor) return null;

        const [r, g, b] = dominantColor.split(',').map(Number);

        // Convert to hex
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error.message);
        return null;
    }
}

async function addHex45ToVideos() {
    console.log('Loading videos.json...');
    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const video of videos) {
        const videoId = video.url.split('v=')[1]?.split('&')[0];
        if (!videoId) {
            console.log(`⚠️  Skipping video (no ID): ${video.title}`);
            skipped++;
            continue;
        }

        // Check if already has hex45
        if (video.hex45) {
            skipped++;
            continue;
        }

        const jpgPath = path.join(CAPTURES_DIR, `${videoId}_45s.jpg`);

        if (!fs.existsSync(jpgPath)) {
            console.log(`⚠️  Missing 45s screenshot: ${videoId}`);
            skipped++;
            continue;
        }

        const hex45 = await getDominantColor(jpgPath);

        if (hex45) {
            video.hex45 = hex45;
            processed++;

            if (processed % 10 === 0) {
                console.log(`✅ Processed ${processed} videos...`);
            }
        } else {
            errors++;
        }
    }

    // Save updated videos.json
    console.log('\nSaving updated videos.json...');
    fs.writeFileSync(VIDEOS_JSON, JSON.stringify(videos, null, 2));

    console.log('\n📊 Summary:');
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total videos: ${videos.length}`);
}

// Run the script
addHex45ToVideos().catch(console.error);
