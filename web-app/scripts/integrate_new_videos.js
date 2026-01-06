import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);
const includeGifs = args.includes('--with-gifs');
const useParallel = args.includes('--parallel');

console.log('🎬 COLORSFUL - Complete Video Integration Pipeline\n');
console.log('This will:');
console.log('  1. Scrape new videos from YouTube');
console.log('  2. Extract 1s dominant colors');
console.log('  3. Generate JPG assets (1s + 45s)');
if (includeGifs) {
    console.log('  4. Generate GIF assets (45s animated)');
    console.log('  5. Extract 45s dominant colors');
    console.log('  6. Rebuild app (regenerates nebula)');
} else {
    console.log('  4. Extract 45s dominant colors');
    console.log('  5. Rebuild app (regenerates nebula)');
    console.log('\n  ℹ️  Use --with-gifs flag to include GIF generation');
}
if (useParallel) {
    console.log('\n  ⚡ Using parallel processing (10 workers)');
}
console.log('');

const VIDEOS_JSON = path.join(__dirname, '../src/data/videos.json');

// Check initial video count
const initialVideos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));
const initialCount = initialVideos.length;
console.log(`📊 Current database: ${initialCount} videos\n`);

// Build steps array based on flags
const steps = [
    {
        name: '1. Scraping YouTube',
        cmd: 'node scripts/scrape_colors.js',
        required: true
    },
    {
        name: '2. Extracting 1s colors',
        cmd: 'node scripts/extract_dominant_color.js',
        required: true
    },
    {
        name: '3. Generating JPG assets',
        cmd: useParallel ? 'node scripts/extract_frames_parallel.js' : 'node scripts/extract_frames.js',
        required: false,
        note: 'Generating 1s JPG and 45s JPG for each video'
    }
];

// Add GIF generation step if requested
if (includeGifs) {
    steps.push({
        name: '4. Generating GIF assets',
        cmd: useParallel ? 'node scripts/extract_frames_parallel.js' : 'node scripts/extract_frames.js',
        required: false,
        note: '⚠️  This may take several hours and trigger YouTube rate limits'
    });
}

steps.push(
    {
        name: `${includeGifs ? '5' : '4'}. Extracting 45s colors`,
        cmd: 'node scripts/add_hex45.js',
        required: true
    },
    {
        name: `${includeGifs ? '6' : '5'}. Rebuilding app`,
        cmd: 'npm run build',
        required: true,
        note: 'This regenerates color space distributions'
    }
);

let completedSteps = 0;

for (const step of steps) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${step.name}`);
    if (step.note) console.log(`   ℹ️  ${step.note}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        execSync(step.cmd, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        console.log(`\n✅ ${step.name} complete`);
        completedSteps++;
    } catch (error) {
        console.error(`\n❌ ${step.name} failed`);
        if (step.required) {
            console.error('This step is required. Aborting pipeline.');
            process.exit(1);
        } else {
            console.log('This step is optional. Continuing...');
        }
    }
}

// Check final video count
const finalVideos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));
const finalCount = finalVideos.length;
const newVideos = finalCount - initialCount;

console.log('\n' + '='.repeat(60));
console.log('✨ Pipeline Complete!');
console.log('='.repeat(60));
console.log(`\n📊 Results:`);
console.log(`   Initial videos: ${initialCount}`);
console.log(`   Final videos: ${finalCount}`);
console.log(`   New videos added: ${newVideos}`);
console.log(`   Steps completed: ${completedSteps}/${steps.length}`);

if (includeGifs) {
    console.log('\n🎬 GIF generation was included in this run');
}

if (newVideos > 0) {
    console.log('\n🎨 Color space distributions have been regenerated!');
    console.log('   - Logo nebula positions updated');
    console.log('   - Grid nebula will regenerate on load');
}

console.log('\n📦 Next step: Deploy dist/ folder to production');
console.log('   Domain: colorsful.heretique.fr');

console.log('\n💡 Usage examples:');
console.log('   node scripts/integrate_new_videos.js              # JPGs only (fast)');
console.log('   node scripts/integrate_new_videos.js --with-gifs  # Include GIFs (slow)');
console.log('   node scripts/integrate_new_videos.js --parallel   # Use 10 workers\n');
