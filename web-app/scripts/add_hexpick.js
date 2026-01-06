#!/usr/bin/env node

/**
 * Script to add hexpick field to videos.json
 * - Uses user-picked colors from exported JSON where available
 * - Falls back to hex45 for videos without manual picks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const exportedDataPath = path.join(__dirname, '../../kev_assets/colorsful-categories-1767634840399.json');
const videosJsonPath = path.join(__dirname, '../src/data/videos.json');
const outputPath = path.join(__dirname, '../src/data/videos.json');

console.log('📦 Loading exported color picks...');
const exportedData = JSON.parse(fs.readFileSync(exportedDataPath, 'utf8'));

console.log('📦 Loading videos.json...');
const videos = JSON.parse(fs.readFileSync(videosJsonPath, 'utf8'));

console.log(`\n📊 Stats:`);
console.log(`   Total videos: ${videos.length}`);
console.log(`   Exported picks: ${exportedData.editedVideos}`);

// Create a map of URL -> picked color
const pickedColorsMap = new Map();
exportedData.videos.forEach(video => {
    if (video.hexpick) {
        pickedColorsMap.set(video.url, video.hexpick);
    }
});

console.log(`   Picked colors found: ${pickedColorsMap.size}`);

// Update videos with hexpick field
let pickedCount = 0;
let fallbackCount = 0;

videos.forEach(video => {
    if (pickedColorsMap.has(video.url)) {
        // Use user-picked color
        video.hexpick = pickedColorsMap.get(video.url);
        pickedCount++;
    } else {
        // Fallback to hex45
        video.hexpick = video.hex45 || video.color;
        fallbackCount++;
    }
});

console.log(`\n✅ Updated videos:`);
console.log(`   With picked colors: ${pickedCount}`);
console.log(`   With hex45 fallback: ${fallbackCount}`);

// Write updated videos.json
console.log(`\n💾 Writing to ${outputPath}...`);
fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2), 'utf8');

console.log('✅ Done! videos.json has been updated with hexpick field.');
