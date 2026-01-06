import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

// Extract color from a specific coordinate using sharp (more accurate than canvas)
async function getDominantColor(imagePath) {
    try {
        const image = sharp(imagePath);
        const metadata = await image.metadata();

        // Sample from coordinate (62%, 38%) where there's usually no text
        const sampleX = Math.floor(metadata.width * 0.62);
        const sampleY = Math.floor(metadata.height * 0.38);

        // Extract a 1x1 pixel region at that coordinate
        const { data } = await image
            .extract({ left: sampleX, top: sampleY, width: 1, height: 1 })
            .raw()
            .toBuffer({ resolveWithObject: true });

        const r = data[0];
        const g = data[1];
        const b = data[2];

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

async function addHex1ToVideos() {
    console.log('Loading videos.json...');
    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const video of videos) {
        const videoId = video.url.split('v=')[1]?.split('&')[0];
        if (!videoId) {
            console.log(`⚠️  Skipping video (no ID): ${video.title}`);
            skipped++;
            continue;
        }

        const jpgPath = path.join(CAPTURES_DIR, `${videoId}_1s.jpg`);

        if (!fs.existsSync(jpgPath)) {
            skipped++;
            continue;
        }

        const hex1 = await getDominantColor(jpgPath);

        if (hex1) {
            const oldHex1 = video.hex1;
            video.hex1 = hex1;

            if (oldHex1 && oldHex1 !== hex1) {
                updated++;
                console.log(`🔄 Updated ${video.title.substring(0, 40)}... ${oldHex1} → ${hex1}`);
            }

            processed++;

            if (processed % 25 === 0) {
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
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total videos: ${videos.length}`);
}

// Run the script
addHex1ToVideos().catch(console.error);
