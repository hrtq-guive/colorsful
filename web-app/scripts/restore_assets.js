import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');
const CAPTURES_DIR = path.join(__dirname, '../public/captures');

// Video IDs that need asset re-extraction
const videosToRestore = [
    'sPlJYAz0fvA', // Sasha Keable - Why
    '9ODCQYa9o3c', // Tanner Adell - CLOSE-UP
    'lm20v6ASSFI', // Billie Eilish - WILDFLOWER
    'DSbqyWXVDYg', // Billie Eilish - idontwannabeyouanymore
    '20iMzRklHNU', // Billie Eilish - watch
    'LwXjlaMbLtw', // zeyne - Ma Bansak
    'TEW3ujNyGFw'  // FKJ - Us
];

async function extractAssets(videoId, videoUrl) {
    console.log(`\n📹 Processing: ${videoId}`);

    try {
        // Extract 1s and 45s JPGs
        console.log('  📸 Extracting screenshots...');
        const jpgCommand = `yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --download-sections "*1-4" --force-keyframes-at-cuts -o - "${videoUrl}" | ffmpeg -i pipe: -vf "select='eq(n,0)'" -frames:v 1 -q:v 2 "${CAPTURES_DIR}/${videoId}_1s.jpg" -y`;
        await execAsync(jpgCommand);

        const jpg45Command = `yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --download-sections "*45-48" --force-keyframes-at-cuts -o - "${videoUrl}" | ffmpeg -i pipe: -vf "select='eq(n,0)'" -frames:v 1 -q:v 2 "${CAPTURES_DIR}/${videoId}_45s.jpg" -y`;
        await execAsync(jpg45Command);

        // Extract GIF
        console.log('  🎬 Extracting GIF...');
        const gifCommand = `yt-dlp -f "best[height<=720]" --download-sections "*45-50" "${videoUrl}" -o - | ffmpeg -i pipe: -vf "fps=10,scale=640:-1:flags=lanczos" -t 5 "${CAPTURES_DIR}/${videoId}_45s.gif" -y`;
        await execAsync(gifCommand, { maxBuffer: 50 * 1024 * 1024 });

        console.log('  ✅ Complete!');
        return true;
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔄 Re-extracting assets for 7 restored videos...\n');

    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));

    for (const videoId of videosToRestore) {
        const video = videos.find(v => v.url.includes(videoId));
        if (video) {
            await extractAssets(videoId, video.url);
        }
    }

    console.log('\n✅ Asset restoration complete!');
}

main().catch(console.error);
