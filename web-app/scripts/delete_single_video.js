import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

const videoId = '9ODCQYa9o3c';

console.log(`🗑️  Deleting video: ${videoId}\n`);

// Load videos.json
const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));
const initialCount = videos.length;

// Find and remove the video
const filteredVideos = videos.filter(video => {
    const id = video.url.split('v=')[1]?.split('&')[0];
    if (id === videoId) {
        console.log(`❌ Removing: ${video.title}`);

        // Delete associated files
        const files = [
            path.join(CAPTURES_DIR, `${videoId}_1s.jpg`),
            path.join(CAPTURES_DIR, `${videoId}_45s.jpg`),
            path.join(CAPTURES_DIR, `${videoId}_45s.gif`)
        ];

        files.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`  🗑️  Deleted: ${path.basename(file)}`);
            }
        });

        return false;
    }
    return true;
});

// Save updated videos.json
fs.writeFileSync(VIDEOS_JSON, JSON.stringify(filteredVideos, null, 2));

console.log(`\n✅ Complete!`);
console.log(`   Videos before: ${initialCount}`);
console.log(`   Videos after: ${filteredVideos.length}`);
console.log(`   Deleted: ${initialCount - filteredVideos.length}`);
