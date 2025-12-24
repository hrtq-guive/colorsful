
const fs = require('fs');
const path = require('path');

// Mocking helper because we can't easily import from utils in raw node without setup
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
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

const videosPath = path.join(__dirname, 'web-app/src/data/videos.json');
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

// 1. Calculate Histogram
const bins = 36; // 10 degrees each
const histogram = new Array(bins).fill(0);

videos.forEach(v => {
    const rgb = hexToRgb(v.color);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const binIndex = Math.floor(hsl.h / (360 / bins)) % bins;
    histogram[binIndex]++;
});

// 2. Add a baseline to avoid zero-width zones
const baseline = videos.length * 0.05 / bins; // 5% minimum share for everyone
const adjustedHistogram = histogram.map(h => h + baseline);
const totalAdjusted = adjustedHistogram.reduce((a, b) => a + b, 0);

// 3. Create Cumulative Map
let currentWarped = 0;
const angleMap = adjustedHistogram.map(h => {
    const share = h / totalAdjusted;
    const start = currentWarped;
    currentWarped += share * 360;
    return { start, end: currentWarped };
});

console.log('Hue Density Analysis:');
histogram.forEach((h, i) => {
    const startHue = i * (360 / bins);
    const warpedRange = angleMap[i].end - angleMap[i].start;
    const multiplier = warpedRange / (360 / bins);
    console.log(`Hue ${startHue.toString().padStart(3)}° : Count ${h.toString().padStart(3)} | Width ${warpedRange.toFixed(1).padStart(4)}° (${multiplier.toFixed(1)}x)`);
});

// Create a lookup function for the code
console.log('\nCopy-pasteable map:');
console.log(JSON.stringify(angleMap.map(a => a.start)));
