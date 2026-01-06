import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON_PATH = path.join(__dirname, '../src/data/videos.json');
const OUTPUT_DIR = path.join(__dirname, '../captured_pages_test');
const BASE_URL = 'http://localhost:5173/';
const CONCURRENCY = 1; // Sequential processing for reliability
const TEST_LIMIT = 10; // Only process first 10 videos

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load video data
const allVideos = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
const videos = allVideos.slice(0, TEST_LIMIT); // Test with first 10 videos
console.log(`🧪 TEST MODE: Processing first ${videos.length} videos...`);

// Worker function
async function processQueue(browser, queue) {
    const page = await browser.newPage();
    // Set viewport to standard 1080p or similar
    await page.setViewport({ width: 1920, height: 1080 });

    while (queue.length > 0) {
        const { video, index } = queue.shift();
        const videoId = video.url.split('v=')[1]?.split('&')[0];
        const slug = (video.hexpickhome || video.color).replace('#', '');
        const url = `${BASE_URL}${slug}`;
        const outputPath = path.join(OUTPUT_DIR, `${videoId}_modal1sec.jpg`);

        if (fs.existsSync(outputPath)) {
            console.log(`⏭️  [${index + 1}/${videos.length}] Skipped (exists): ${video.title}`);
            continue;
        }

        try {
            // Navigate
            console.log(`🔄 [${index + 1}/${videos.length}] Navigating to ${slug}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for video iframe to be present
            await page.waitForSelector('iframe', { timeout: 10000 });

            // CRITICAL: Wait for our custom ".playback-ready" class
            // This is added by VideoModal only when currentTime > 1.0
            await page.waitForSelector('.playback-ready', { timeout: 60000 });

            // Wait a bit more for frame stabilization
            await new Promise(r => setTimeout(r, 500));

            // Capture
            await page.screenshot({ path: outputPath, type: 'jpeg', quality: 90 });
            console.log(`✅ [${index + 1}/${videos.length}] Captured: ${video.title}`);

        } catch (error) {
            console.error(`❌ [${index + 1}/${videos.length}] Error on ${video.title}: ${error.message}`);
        }
    }

    await page.close();
}

(async () => {
    const startTime = Date.now();

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const queue = videos.map((video, index) => ({ video, index }));
    const workers = [];

    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(processQueue(browser, queue));
    }

    await Promise.all(workers);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST CAPTURE COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    console.log('='.repeat(60));

    await browser.close();
    process.exit(0);
})();
