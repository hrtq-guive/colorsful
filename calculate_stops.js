
const fs = require('fs');
const path = require('path');

const videosPath = path.join(__dirname, 'web-app/src/data/videos.json');
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

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

const segments = 72; // One stop every 5 degrees
const angleBins = new Array(segments).fill(0).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

videos.forEach(v => {
    const rgb = hexToRgb(v.color);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const binIndex = Math.floor(hsl.h / (360 / segments)) % segments;
    angleBins[binIndex].r += rgb.r;
    angleBins[binIndex].g += rgb.g;
    angleBins[binIndex].b += rgb.b;
    angleBins[binIndex].count++;
});

// Final stops
const stops = angleBins.map((bin, i) => {
    if (bin.count === 0) {
        // Find nearest neighbor for empty bins to keep the gradient smooth
        // Actually, just using HSL interpolates well if we have enough base colors
        const h = i * (360 / segments);
        return `hsl(${h}, 100%, 50%)`;
    }
    const r = Math.round(bin.r / bin.count);
    const g = Math.round(bin.g / bin.count);
    const b = Math.round(bin.b / bin.count);
    return `rgb(${r}, ${g}, ${b})`;
});

console.log('--- Data-Driven Stops (Copy-paste) ---');
console.log(JSON.stringify(stops));
