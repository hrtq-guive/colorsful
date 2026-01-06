import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON_PATH = path.join(__dirname, '../src/data/videos.json');
const MANUAL_PICKS_PATH = path.join(__dirname, '../../kev_assets/colorsful-modal1sec-1767708098755.json');

async function importManualColorPicks() {
    console.log('🎨 Importing manual color picks from kev_assets...\n');

    // Load both JSON files
    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
    const manualPicks = JSON.parse(fs.readFileSync(MANUAL_PICKS_PATH, 'utf-8'));

    console.log(`📊 Found ${videos.length} videos in videos.json`);
    console.log(`📊 Found ${manualPicks.videos.length} manual picks (${manualPicks.editedVideos} edited)\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Create a map of URL -> hexpickhome from manual picks
    const manualPicksMap = new Map();
    manualPicks.videos.forEach(pick => {
        if (pick.hexpickhome) {
            manualPicksMap.set(pick.url, pick.hexpickhome);
        }
    });

    // Update videos.json with manual picks
    videos.forEach(video => {
        if (manualPicksMap.has(video.url)) {
            video.hexpickhome = manualPicksMap.get(video.url);
            updatedCount++;
        } else {
            skippedCount++;
        }
    });

    // Save updated videos.json
    fs.writeFileSync(VIDEOS_JSON_PATH, JSON.stringify(videos, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MANUAL COLOR IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount} (no manual pick found)`);
    console.log(`📊 Total: ${videos.length}`);
    console.log(`💾 Saved to: ${VIDEOS_JSON_PATH}`);
    console.log('='.repeat(60));
}

importManualColorPicks();
