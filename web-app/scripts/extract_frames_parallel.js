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

// PARALLEL PROCESSING SETTINGS
const PARALLEL_WORKERS = 10; // Process 10 videos at once (reduced for stability)
let activeWorkers = 0;
let completedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log(`🚀 Starting PARALLEL extraction for ${videos.length} videos...`);
console.log(`⚡ Running ${PARALLEL_WORKERS} workers simultaneously`);
console.log('📦 Generating: 1s JPG, 45s JPG, 45s GIF\n');

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
    const tempFile = path.join(OUTPUT_DIR, `temp_${videoId}_${startSeconds}_${Date.now()}.webm`);
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
        console.error(`❌ Error processing ${videoId} at ${startSeconds}s: ${e.message}`);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
    return false;
};

/**
 * Process a single video (all its assets)
 */
const processVideo = async (video, index) => {
    const videoId = video.url.split('v=')[1]?.split('&')[0];
    if (!videoId) {
        console.log(`⚠️  [${index + 1}/${videos.length}] Invalid URL: ${video.title}`);
        return { skipped: true };
    }

    // Check if all files exist to skip
    const p1 = path.join(OUTPUT_DIR, `${videoId}_1s.jpg`);
    const p2 = path.join(OUTPUT_DIR, `${videoId}_45s.jpg`);
    const p3 = path.join(OUTPUT_DIR, `${videoId}_45s.gif`);

    if (fs.existsSync(p1) && fs.existsSync(p2) && fs.existsSync(p3)) {
        return { skipped: true };
    }

    try {
        // 1. Extract 1s Frame (Static)
        if (!fs.existsSync(p1)) {
            await processTimestamp(videoId, 1, [{ type: 'jpg', suffix: '_1s.jpg' }]);
        }

        // 2. Extract 45s Frames (Static + GIF)
        if (!fs.existsSync(p2) || !fs.existsSync(p3)) {
            await processTimestamp(videoId, 45, [
                { type: 'jpg', suffix: '_45s.jpg' },
                { type: 'gif', suffix: '_45s.gif' }
            ]);
        }

        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to process ${video.title}: ${error.message}`);
        return { error: true };
    }
};

/**
 * Worker function that processes videos from the queue
 */
const worker = async (videoQueue) => {
    while (videoQueue.length > 0) {
        const { video, index } = videoQueue.shift();
        activeWorkers++;

        const result = await processVideo(video, index);

        if (result.skipped) {
            skippedCount++;
            console.log(`✓ [${index + 1}/${videos.length}] Skipped (exists): ${video.title}`);
        } else if (result.success) {
            completedCount++;
            console.log(`✅ [${index + 1}/${videos.length}] Completed: ${video.title}`);
        } else if (result.error) {
            errorCount++;
        }

        activeWorkers--;

        // Progress update every 10 videos
        const totalProcessed = completedCount + skippedCount + errorCount;
        if (totalProcessed % 10 === 0) {
            console.log(`\n📊 Progress: ${totalProcessed}/${videos.length} | ✅ ${completedCount} | ⏭️  ${skippedCount} | ❌ ${errorCount}\n`);
        }
    }
};

/**
 * Main execution with parallel workers
 */
(async () => {
    const startTime = Date.now();

    // Create queue of videos to process
    const videoQueue = videos.map((video, index) => ({ video, index }));

    // Start parallel workers
    const workers = [];
    for (let i = 0; i < PARALLEL_WORKERS; i++) {
        workers.push(worker(videoQueue));
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 PARALLEL EXTRACTION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration} minutes`);
    console.log(`✅ Completed: ${completedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total processed: ${completedCount + skippedCount + errorCount}/${videos.length}`);
    console.log('='.repeat(60));
})();
