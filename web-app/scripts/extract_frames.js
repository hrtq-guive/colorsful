import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosPath = path.join(__dirname, '../src/data/videos.json');
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

const OUTPUT_DIR = path.join(__dirname, '../public/captures');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`Starting full extraction for ${videos.length} videos...`);
console.log('Generating: 1s JPG, 45s JPG, 45s GIF');

/**
 * Downloads a clip and extracts assets (JPG and/or GIF)
 * @param {string} videoId 
 * @param {number} startSeconds 
 * @param {Array<{type: 'jpg'|'gif', suffix: string}>} targets 
 */
const processTimestamp = async (videoId, startSeconds, targets) => {
    // Download 3s clip to ensure we have enough buffer
    const clipDuration = 3;
    const endSeconds = startSeconds + clipDuration;
    const tempFile = path.join(OUTPUT_DIR, `temp_${videoId}_${startSeconds}.webm`);
    const section = `*${startSeconds}-${endSeconds}`;

    try {
        // Download clip
        await execPromise(`yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --download-sections "${section}" --force-keyframes-at-cuts -o "${tempFile}" "https://www.youtube.com/watch?v=${videoId}"`);

        if (fs.existsSync(tempFile)) {
            for (const target of targets) {
                const finalPath = path.join(OUTPUT_DIR, `${videoId}${target.suffix}`);

                if (target.type === 'gif') {
                    // Optimized Ping-Pong GIF: 2s Forward + 2s Reverse = 4s Loop
                    const gifFilter = "fps=12,scale=480:-1:flags=lanczos,split[v0][v1];[v1]reverse[v2];[v0][v2]concat=n=2:v=1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
                    await execPromise(`ffmpeg -i "${tempFile}" -t 2 -vf "${gifFilter}" -loop 0 -y "${finalPath}"`);
                } else {
                    // High quality JPG
                    await execPromise(`ffmpeg -i "${tempFile}" -frames:v 1 -q:v 2 -y "${finalPath}"`);
                }
            }

            // Cleanup clip after all targets processed
            fs.unlinkSync(tempFile);
            return true;
        }
    } catch (e) {
        console.error(`Error processing ${videoId} at ${startSeconds}s: ${e.message}`);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
    return false;
};

(async () => {
    for (const [index, video] of videos.entries()) {
        const videoId = video.url.split('v=')[1]?.split('&')[0];
        if (!videoId) continue;

        console.log(`[${index + 1}/${videos.length}] Processing ${video.title}...`);

        // Check if all files exist to skip
        const p1 = path.join(OUTPUT_DIR, `${videoId}_1s.jpg`);
        const p2 = path.join(OUTPUT_DIR, `${videoId}_45s.jpg`);
        const p3 = path.join(OUTPUT_DIR, `${videoId}_45s.gif`);

        if (fs.existsSync(p1) && fs.existsSync(p2) && fs.existsSync(p3)) {
            console.log('  -> All assets exist, skipping.');
            continue;
        }

        // 1. Extract 1s Frame (Static)
        if (!fs.existsSync(p1)) {
            console.log('  -> Generating 1s assets...');
            await processTimestamp(videoId, 1, [{ type: 'jpg', suffix: '_1s.jpg' }]);
        }

        // 2. Extract 45s Frames (Static + GIF)
        if (!fs.existsSync(p2) || !fs.existsSync(p3)) {
            console.log('  -> Generating 45s assets...');
            // We define what we need. If one exists but not other, we'll overwrite or just regenerate both from the clip.
            // Simplified: regenerate both if either is missing to save logic complexity, usually fine.
            await processTimestamp(videoId, 45, [
                { type: 'jpg', suffix: '_45s.jpg' },
                { type: 'gif', suffix: '_45s.gif' }
            ]);
        }
    }
    console.log('Full extraction complete!');
})();
