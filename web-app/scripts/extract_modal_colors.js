import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON_PATH = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captured_pages');

// Extract color from a specific region of the image
async function getAverageColorFromRegion(imagePath, x, y, width, height) {
    const { data, info } = await sharp(imagePath)
        .extract({ left: x, top: y, width, height })
        .raw()
        .toBuffer({ resolveWithObject: true });

    let r = 0, g = 0, b = 0;
    const pixelCount = width * height;

    for (let i = 0; i < data.length; i += info.channels) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

async function extractBackgroundColorFromModal(imagePath) {
    // Get image dimensions
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width;
    const height = metadata.height;

    // The modal layout at 1920x1080:
    // - Video player is centered, 16:9 aspect ratio
    // - Typical size: ~1536px wide (80vw at 1920px) × ~864px tall
    // - Video player starts roughly at x: 192, y: 108 (centered)

    // Calculate approximate video player position (centered, 80vw max 800px)
    const videoWidth = Math.min(width * 0.8, 1280); // 80vw or max ~1280px at 1920px viewport
    const videoHeight = videoWidth * (9 / 16); // 16:9 aspect ratio

    const videoLeft = (width - videoWidth) / 2;
    const videoTop = (height - videoHeight) / 2;

    // Sample from BOTTOM-LEFT corner of the video player
    const sampleSize = 50; // 50x50 pixel sample
    const sampleX = Math.floor(videoLeft + 20); // 20px from left edge of video
    const sampleY = Math.floor(videoTop + videoHeight - sampleSize - 20); // 20px from bottom edge

    const bottomLeftColor = await getAverageColorFromRegion(imagePath, sampleX, sampleY, sampleSize, sampleSize);

    return rgbToHex(bottomLeftColor.r, bottomLeftColor.g, bottomLeftColor.b);
}

async function extractColorsFromModalCaptures() {
    console.log('🎨 Extracting BACKGROUND colors from modal1sec captures...\n');

    // Load videos.json
    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
    console.log(`📊 Found ${videos.length} videos\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const videoId = video.url.split('v=')[1]?.split('&')[0];

        if (!videoId) {
            console.log(`⚠️  [${i + 1}/${videos.length}] Invalid URL: ${video.title}`);
            skippedCount++;
            continue;
        }

        const capturePath = path.join(CAPTURES_DIR, `${videoId}_modal1sec.jpg`);

        if (!fs.existsSync(capturePath)) {
            console.log(`⏭️  [${i + 1}/${videos.length}] No capture found: ${video.title}`);
            skippedCount++;
            continue;
        }

        try {
            // Extract background color from the modal (not the video content)
            const hexColor = await extractBackgroundColorFromModal(capturePath);
            video.hexpickhome = hexColor;
            updatedCount++;

            if ((i + 1) % 50 === 0) {
                console.log(`✅ [${i + 1}/${videos.length}] Processed ${updatedCount} videos...`);
            }

        } catch (error) {
            console.log(`❌ [${i + 1}/${videos.length}] Error: ${video.title} - ${error.message}`);
            errorCount++;
        }
    }

    // Save updated videos.json
    fs.writeFileSync(VIDEOS_JSON_PATH, JSON.stringify(videos, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('🎉 BACKGROUND COLOR EXTRACTION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${videos.length}`);
    console.log(`💾 Saved to: ${VIDEOS_JSON_PATH}`);
    console.log('='.repeat(60));
}

extractColorsFromModalCaptures();
