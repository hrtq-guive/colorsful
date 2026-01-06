import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

// Only delete these specific videos (excluding the 7 to restore)
const videosToDelete = [
    'epKjNz5bpCs', // 1. Sasha Keable - CLOSE-UP
    'P0DepksPfU8', // 4. Tanner Adell - Religion
    'eG3rULr-rcw', // 6. Billie Eilish - CLOSE-UP
    'KoIaooNx_VM', // 9. zeyne - INTERVIEW
    'Z8MSb745syo', // 11. FKJ - INTERVIEW
    'thjz6LcEofE', // 13. Seinabo Sey - THE ONE AFTER ME
    'rIBNH61sOMc', // 14. Hans Philip - Juno 18
    'sWxudEOEsxQ', // 15. Lagos in Motion
    '1caarz4lzV8', // 16. The Color of Love
    'LHbA_UGa1w4', // 17. BRAZIL
    'bPNqkYlwu6k', // 18. Saya Gray - HOMEGROWN
    '2rQJu-13Gx0'  // 19. Fousheé - HOMEGROWN
];

console.log(`🗑️  Deleting ${videosToDelete.length} videos (keeping 7 restored)...\n`);

// Load videos.json
const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));
const initialCount = videos.length;

// Filter out videos to delete
const filteredVideos = videos.filter(video => {
    const videoId = video.url.split('v=')[1]?.split('&')[0];
    if (videosToDelete.includes(videoId)) {
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
console.log(`   Restored: 7 videos kept`);
