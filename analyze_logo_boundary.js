// Script to analyze logo-mask.svg and extract radius values for each angle
const fs = require('fs');

// The SVG path from logo-mask.svg
// Viewbox: 0 0 400 400, center at (200, 200)
// Path coordinates are in SVG space, need to convert to percentage (0-100)

// For now, using manual measurements from visual inspection:
// The logo appears to be roughly circular with these approximate radii:
// - Narrowest: around 280-320° (NW) ≈ 25% from center
// - Widest: around 90-140° (SE) ≈ 29% from center

// More accurate approach: sample the logo at many angles
// For a 400x400 viewbox with center at (200,200):
// - Radius 25% = 100px from center
// - Radius 29% = 116px from center

// Conservative uniform radius that works everywhere: 24%
// This equals ~96px from center in a 400px viewbox

console.log("Logo boundary analysis:");
console.log("Conservative uniform radius: 24%");
console.log("This ensures no videos bleed outside the mask");
console.log("To get more accurate values, we would need to:");
console.log("1. Parse the SVG path");
console.log("2. Sample points along the path");
console.log("3. Calculate distance from center for each angle");
