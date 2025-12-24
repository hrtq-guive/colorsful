
const fs = require('fs');
const path = require('path');

const videosPath = path.join(__dirname, 'web-app/src/data/videos.json');
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

// Re-implementing helper functions for analysis
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0; else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

const WARPED_STOPS = [0, 29.47, 47.99, 85.20, 104.37, 122.89, 136.90, 141.24, 144.30, 146.71, 151.70, 155.39, 159.74, 161.50, 164.56, 168.25, 175.82, 185.32, 194.17, 204.96, 215.75, 238.14, 252.15, 265.51, 271.79, 281.29, 287.56, 297.06, 300.12, 304.46, 306.22, 308.63, 311.04, 319.25, 326.82, 338.25, 360];
const DENSITY_COUNTS = [45, 28, 57, 29, 28, 21, 6, 4, 3, 7, 5, 6, 2, 4, 5, 11, 14, 13, 16, 16, 34, 21, 20, 9, 14, 9, 14, 4, 6, 2, 3, 3, 12, 11, 17, 33];
const MAX_COUNT = 57;

function warp(hue) {
    const binSize = 10;
    const binIndex = Math.floor(hue / binSize) % 36;
    const remainder = (hue % binSize) / binSize;
    const startAngle = WARPED_STOPS[binIndex];
    const endAngle = WARPED_STOPS[binIndex + 1];
    return startAngle + (endAngle - startAngle) * remainder;
}

function getRadiusMultiplier(hue) {
    const binSize = 10;
    const binIndex = Math.floor(hue / binSize) % 36;
    const nextBinIndex = (binIndex + 1) % 36;
    const remainder = (hue % binSize) / binSize;
    const count = DENSITY_COUNTS[binIndex];
    const nextCount = DENSITY_COUNTS[nextBinIndex];
    const smoothedCount = count + (nextCount - count) * remainder;
    return 0.7 + (smoothedCount / MAX_COUNT) * 0.6;
}

const processed = videos.map((v, i) => {
    const rgb = hexToRgb(v.color);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const warpedHue = warp(hsl.h);
    const angleRad = (warpedHue - 90) * (Math.PI / 180);
    const vibrancy = hsl.s * (1 - Math.abs(hsl.l - 50) / 50);
    const deformedRadius = (vibrancy / 2) * getRadiusMultiplier(hsl.h);
    const x = 50 + deformedRadius * Math.cos(angleRad);
    const y = 50 + deformedRadius * Math.sin(angleRad);
    return { title: v.title, x, y, hue: hsl.h };
}).filter(v => v);

// 1. Check for exact coordinate overlaps
const coordinateMap = {};
let overlaps = 0;
processed.forEach(v => {
    const key = `${v.x.toFixed(2)},${v.y.toFixed(2)}`;
    if (coordinateMap[key]) {
        overlaps++;
    } else {
        coordinateMap[key] = true;
    }
});

console.log(`Total Videos: ${processed.length}`);
console.log(`Unique Positions (2 decimal precision): ${Object.keys(coordinateMap).length}`);
console.log(`Video Overlaps: ${overlaps}`);

// 2. Check Red Zone (Hue 0-20)
const redZone = processed.filter(v => v.hue < 20 || v.hue > 340);
console.log(`\nRed Zone Videos: ${redZone.length}`);
console.log(`Unique positions in Red Zone: ${new Set(redZone.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`)).size}`);

// 3. Focus on PLK & Token
const favorites = processed.filter(v => v.title.includes('PLK') || v.title.includes('Token'));
favorites.forEach(v => {
    console.log(`Target: ${v.title.padEnd(40)} | Pos: (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
});
