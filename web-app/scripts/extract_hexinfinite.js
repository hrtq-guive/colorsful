import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Vibrant } from 'node-vibrant/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_JSON_PATH = path.join(__dirname, '../src/data/videos.json');
const BASE_URL = 'http://localhost:5173/video/';
const SCREENSHOT_DIR = path.join(__dirname, '../temp_screenshots');

// Create temp directory for screenshots
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function extractHexInfinite() {
    console.log('🎨 Starting hexinfinite color extraction...\n');

    // Load videos.json
    const videosData = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
    console.log(`📊 Found ${videosData.length} videos\n`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    try {
        let updatedCount = 0;

        for (let i = 0; i < videosData.length; i++) {
            const video = videosData[i];
            const videoId = video.url.split('v=')[1];

            console.log(`\n[${i + 1}/${videosData.length}] ${video.title}`);

            try {
                // Navigate directly to video page
                await page.goto(`${BASE_URL}${videoId}`, { waitUntil: 'networkidle0' });
                console.log('  ▶️  Opened video page');

                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Wait for iframe to load
                await page.waitForSelector('iframe', { timeout: 10000 });
                console.log('  ▶️  Iframe loaded');

                // Wait 5 seconds for video to autoplay and start
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Check if video is actually playing by checking if YouTube player exists
                const isPlaying = await page.evaluate(() => {
                    const iframe = document.querySelector('iframe');
                    return iframe !== null;
                });

                if (isPlaying) {
                    console.log('  ▶️  Video confirmed playing');
                } else {
                    console.log('  ⚠️  Video may not be playing');
                }

                // Take screenshot of the full page
                const screenshotPath = path.join(SCREENSHOT_DIR, `${videoId}.png`);
                await page.screenshot({ path: screenshotPath });
                console.log('  📸 Captured screenshot');

                // Extract dominant color
                const palette = await Vibrant.from(screenshotPath).getPalette();
                const dominantSwatch = palette.Vibrant || palette.DarkVibrant || palette.LightVibrant || palette.Muted;

                if (dominantSwatch) {
                    const hexInfinite = dominantSwatch.hex;
                    video.hexinfinite = hexInfinite;
                    console.log(`  🎨 ${hexInfinite}`);
                    updatedCount++;
                } else {
                    console.log('  ⚠️  Could not extract color');
                }

                // Clean up screenshot
                fs.unlinkSync(screenshotPath);

            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }

        // Save updated videos.json
        fs.writeFileSync(VIDEOS_JSON_PATH, JSON.stringify(videosData, null, 2));
        console.log(`\n✅ Successfully updated ${updatedCount}/${videosData.length} videos`);
        console.log(`💾 Saved to ${VIDEOS_JSON_PATH}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await browser.close();

        // Clean up temp directory
        if (fs.existsSync(SCREENSHOT_DIR)) {
            fs.rmSync(SCREENSHOT_DIR, { recursive: true });
        }
    }
}

extractHexInfinite();
