import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Vibrant } from 'node-vibrant/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON_PATH = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

console.log('🎨 Extracting hex1 colors from existing 1s captures...\n');

const videosData = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
console.log(`📊 Found ${videosData.length} videos\n`);

let updatedCount = 0;
let notFoundCount = 0;

for (let i = 0; i < videosData.length; i++) {
    const video = videosData[i];
    const videoId = video.url.split('v=')[1];
    const capturePath = path.join(CAPTURES_DIR, `${videoId}_1s.jpg`);

    console.log(`[${i + 1}/${videosData.length}] ${video.title}`);

    if (fs.existsSync(capturePath)) {
        try {
            const palette = await Vibrant.from(capturePath).getPalette();
            const dominantSwatch = palette.Vibrant || palette.DarkVibrant || palette.LightVibrant || palette.Muted;

            if (dominantSwatch) {
                const hex1 = dominantSwatch.hex;
                video.hex1 = hex1;
                console.log(`  ✅ ${hex1}`);
                updatedCount++;
            } else {
                console.log('  ⚠️  Could not extract color');
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    } else {
        console.log('  ⚠️  No 1s capture found');
        notFoundCount++;
    }
}

fs.writeFileSync(VIDEOS_JSON_PATH, JSON.stringify(videosData, null, 2));

console.log(`\n✅ Complete!`);
console.log(`   Updated: ${updatedCount}`);
console.log(`   Not found: ${notFoundCount}`);
console.log(`   Total: ${videosData.length}`);
console.log(`💾 Saved to ${VIDEOS_JSON_PATH}`);
