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
const PARALLEL_WORKERS = 5;

// Generate GIF from YouTube video
async function generateGif(videoId, videoUrl) {
    const gifPath = path.join(CAPTURES_DIR, `${videoId}_45s.gif`);

    // Skip if GIF already exists
    if (fs.existsSync(gifPath)) {
        return { success: true, skipped: true };
    }

    try {
        // Download 45-second segment and convert to GIF
        const command = `yt-dlp -f "best[height<=720]" --download-sections "*45-50" "${videoUrl}" -o - | ffmpeg -i pipe: -vf "fps=10,scale=640:-1:flags=lanczos" -t 5 "${gifPath}" -y`;

        await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });

        return { success: true, skipped: false };
    } catch (error) {
        console.error(`Error generating GIF for ${videoId}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Process videos in parallel with worker pool
async function processVideosInParallel(videos, workerCount) {
    let processed = 0;
    let generated = 0;
    let skipped = 0;
    let errors = 0;

    const queue = [...videos];
    const workers = [];

    const worker = async () => {
        while (queue.length > 0) {
            const video = queue.shift();
            if (!video) break;

            const videoId = video.url.split('v=')[1]?.split('&')[0];
            if (!videoId) {
                errors++;
                continue;
            }

            console.log(`[${processed + 1}/${videos.length}] Processing: ${video.title.substring(0, 50)}...`);

            const result = await generateGif(videoId, video.url);

            processed++;

            if (result.success) {
                if (result.skipped) {
                    skipped++;
                } else {
                    generated++;
                    console.log(`✅ Generated GIF for ${videoId}`);
                }
            } else {
                errors++;
            }

            // Write progress to file for UI
            const progressPath = path.join(CAPTURES_DIR, '../gif-progress.json');
            fs.writeFileSync(progressPath, JSON.stringify({
                generated: generated + skipped,
                total: videos.length,
                isGenerating: true,
                newlyGenerated: generated,
                skipped,
                errors
            }));

            // Progress update every 10 videos
            if (processed % 10 === 0) {
                console.log(`\n📊 Progress: ${processed}/${videos.length} | Generated: ${generated} | Skipped: ${skipped} | Errors: ${errors}\n`);
            }
        }
    };

    // Start worker pool
    for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    return { processed, generated, skipped, errors };
}

async function main() {
    console.log('🎬 Starting parallel GIF generation...\n');
    console.log(`Workers: ${PARALLEL_WORKERS}\n`);

    const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));

    const startTime = Date.now();
    const stats = await processVideosInParallel(videos, PARALLEL_WORKERS);
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    // Mark generation as complete
    const progressPath = path.join(__dirname, '../public/gif-progress.json');
    fs.writeFileSync(progressPath, JSON.stringify({
        generated: stats.generated + stats.skipped,
        total: videos.length,
        isGenerating: false,
        newlyGenerated: stats.generated,
        skipped: stats.skipped,
        errors: stats.errors
    }));

    console.log('\n✅ GIF generation complete!\n');
    console.log('📊 Final Stats:');
    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Generated: ${stats.generated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Duration: ${duration} minutes`);
}

main().catch(console.error);
