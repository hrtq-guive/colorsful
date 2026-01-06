import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTURES_DIR = path.join(__dirname, '../public/captures');

async function extractJpgFromGif() {
    console.log('🎬 Extracting JPGs from GIFs...\n');

    // Find all GIFs
    const files = fs.readdirSync(CAPTURES_DIR);
    const gifFiles = files.filter(f => f.endsWith('_45s.gif'));

    let extracted = 0;
    let skipped = 0;
    let errors = 0;

    for (const gifFile of gifFiles) {
        const videoId = gifFile.replace('_45s.gif', '');
        const gifPath = path.join(CAPTURES_DIR, gifFile);
        const jpgPath = path.join(CAPTURES_DIR, `${videoId}_45s.jpg`);

        // Skip if JPG already exists
        if (fs.existsSync(jpgPath)) {
            skipped++;
            continue;
        }

        try {
            // Extract first frame from GIF as high-quality JPG
            await execAsync(`ffmpeg -i "${gifPath}" -frames:v 1 -q:v 2 "${jpgPath}" -y`);
            extracted++;
            console.log(`✅ Extracted JPG from ${gifFile}`);
        } catch (error) {
            errors++;
            console.error(`❌ Error extracting from ${gifFile}:`, error.message);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Extracted: ${extracted}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total GIFs: ${gifFiles.length}`);
}

extractJpgFromGif().catch(console.error);
