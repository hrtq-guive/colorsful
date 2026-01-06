import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_PATH = path.join(__dirname, '../src/data/videos.json');
const SOURCE_JSON_PATH = '/Users/kevinechraghi/Desktop/SYMPATHIQUE/PERSONNAL_TECH/DEV/LIVE/COLORSFUL/kev_assets/home_colorsful-categories-1767640313483.json';

// Read videos.json
const videosRaw = fs.readFileSync(VIDEOS_PATH, 'utf8');
const videos = JSON.parse(videosRaw);

// Read source JSON
let sourceData = { videos: [] };
if (fs.existsSync(SOURCE_JSON_PATH)) {
    const sourceRaw = fs.readFileSync(SOURCE_JSON_PATH, 'utf8');
    sourceData = JSON.parse(sourceRaw);
} else {
    console.error(`Source file not found: ${SOURCE_JSON_PATH}`);
    process.exit(1);
}

// Create map of url -> hexpickhome
const hexpickMap = new Map();
if (sourceData.videos) {
    sourceData.videos.forEach(v => {
        if (v.hexpickhome) {
            hexpickMap.set(v.url, v.hexpickhome);
        }
    });
}

console.log(`Found ${hexpickMap.size} picked home colors in source file.`);

// Update videos
let updatedCount = 0;
let fallbackCount = 0;

const updatedVideos = videos.map(video => {
    // If we have a picked color for home, use it
    if (hexpickMap.has(video.url)) {
        updatedCount++;
        return {
            ...video,
            hexpickhome: hexpickMap.get(video.url)
        };
    }

    // Otherwise use historical color (video.color)
    fallbackCount++;
    return {
        ...video,
        hexpickhome: video.color
    };
});

fs.writeFileSync(VIDEOS_PATH, JSON.stringify(updatedVideos, null, 2));

console.log(`Update complete!`);
console.log(`- Used picked colors: ${updatedCount}`);
console.log(`- Used historical fallback: ${fallbackCount}`);
console.log(`- Total videos: ${updatedVideos.length}`);
