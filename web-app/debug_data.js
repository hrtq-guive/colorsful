import { hexToRgb, rgbToHsl } from './src/utils/color.js';
import videos from './src/data/videos.json' assert { type: "json" };

console.log("Total videos loaded:", videos.length);

const processed = videos.map((v, i) => {
    const rgb = hexToRgb(v.color);
    if (!rgb) console.log("Failed to parse color:", v.color);
    return { ...v, id: i, rgb };
}).filter(v => v.rgb);

console.log("Total processed videos:", processed.length);

if (processed.length > 0) {
    console.log("Sample video:", processed[0]);
}

// Test Sample Distance
const target = { r: 100, g: 100, b: 100 };
const dists = processed.map(v => Math.sqrt(
    Math.pow(target.r - v.rgb.r, 2) +
    Math.pow(target.g - v.rgb.g, 2) +
    Math.pow(target.b - v.rgb.b, 2)
));
console.log("Min dist to gray:", Math.min(...dists));
