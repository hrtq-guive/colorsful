import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosPath = path.join(__dirname, '../src/data/videos.json');
const capturesDir = path.join(__dirname, '../public/captures');
const progressFile = path.join(__dirname, '../public/gif-progress.json');

// Read total videos
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));
const totalVideos = videos.length;

// Count existing assets
let existingGifs = 0;
let existingJpgs = 0;

if (fs.existsSync(capturesDir)) {
    const files = fs.readdirSync(capturesDir);
    existingGifs = files.filter(f => f.endsWith('.gif')).length;
    existingJpgs = files.filter(f => f.endsWith('.jpg')).length;
}

const progress = {
    totalVideos,
    gifsCompleted: existingGifs,
    jpgsCompleted: existingJpgs,
    percentageGifs: Math.round((existingGifs / totalVideos) * 100),
    percentageJpgs: Math.round((existingJpgs / totalVideos) * 100),
    lastUpdated: new Date().toISOString()
};

// Write progress file
fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

console.log('Progress updated:', progress);
