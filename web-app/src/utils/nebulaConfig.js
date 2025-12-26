import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, hslToRgb } from './color';

// 1. Prepare videos with HSL
// Distribute achromatic videos (S < 5) across 360 degrees
const videosWithHsl = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };

    // De-cluster White/Black/Grey videos from 0 degrees
    if (hsl.s < 5) {
        // Use Golden Angle to distribute them evenly around the circle
        hsl.h = (i * 137.508) % 360;
    }

    return { ...v, hsl, originalId: i };
}).filter(v => v.color);

// 2. LOGO SHAPE DEFINITION
const radiusLookup360 = [
    32.1, 32.4, 32.1, 32.2, 32.2, 32.2, 32.3, 32.3, 32.4, 32.3,  // 0-9°
    32.3, 32.2, 32.3, 32.2, 32.3, 32.2, 32.1, 32.1, 32.2, 32.1,  // 10-19°
    32.3, 32.3, 32.2, 32.2, 32.2, 32.2, 32.2, 32.2, 32.4, 32.4,  // 20-29°
    32.5, 32.5, 32.6, 32.6, 32.7, 32.8, 32.9, 33.0, 32.8, 33.0,  // 30-39°
    33.1, 33.3, 33.4, 33.3, 33.5, 33.7, 33.9, 33.9, 34.1, 34.1,  // 40-49°
    34.4, 34.4, 34.7, 34.7, 34.7, 34.9, 35.1, 35.0, 35.1, 35.1,  // 50-59°
    34.8, 34.7, 34.7, 34.4, 34.4, 34.1, 34.1, 33.8, 33.6, 33.3,  // 60-69°
    33.4, 33.2, 33.0, 32.8, 32.6, 32.5, 32.3, 32.2, 32.1, 32.0,  // 70-79°
    31.8, 31.8, 31.7, 31.6, 31.5, 31.5, 31.4, 31.2, 31.1, 31.1,  // 80-89°
    31.1, 30.9, 30.9, 30.9, 30.7, 30.7, 30.8, 30.8, 30.7, 30.7,  // 90-99°
    30.6, 30.7, 30.6, 30.6, 30.5, 30.7, 30.5, 30.7, 30.6, 30.8,  // 100-109°
    30.7, 30.6, 30.9, 30.8, 30.8, 30.7, 31.0, 31.0, 31.0, 31.0,  // 110-119°
    31.0, 31.1, 31.1, 31.1, 31.2, 31.3, 31.3, 31.4, 31.5, 31.7,  // 120-129°
    31.8, 31.8, 31.9, 32.1, 32.1, 32.3, 32.5, 32.4, 32.7, 33.0,  // 130-139°
    32.9, 33.2, 33.4, 33.4, 33.5, 33.7, 33.7, 33.8, 33.7, 33.7,  // 140-149°
    33.6, 33.6, 33.3, 33.2, 33.2, 33.0, 33.0, 32.7, 32.7, 32.8,  // 150-159°
    32.6, 32.6, 32.7, 32.5, 32.6, 32.7, 32.6, 32.7, 32.8, 32.7,  // 160-169°
    32.6, 32.5, 32.4, 32.6, 32.5, 32.5, 32.4, 32.4, 32.4, 32.4,  // 170-179°
    32.1, 32.1, 32.1, 32.2, 32.2, 32.2, 32.0, 32.1, 32.2, 32.0,  // 180-189°
    32.1, 32.1, 32.1, 32.2, 32.1, 32.2, 32.1, 32.1, 32.2, 32.1,  // 190-199°
    32.1, 32.3, 32.2, 32.2, 32.3, 32.2, 32.4, 32.4, 32.4, 32.4,  // 200-209°
    32.2, 32.3, 32.3, 32.3, 32.4, 32.5, 32.3, 32.4, 32.3, 32.3,  // 210-219°
    32.1, 32.2, 32.1, 32.1, 32.1, 32.0, 32.1, 32.0, 31.9, 32.0,  // 220-229°
    31.8, 32.0, 31.9, 31.8, 32.0, 31.9, 32.0, 31.9, 32.0, 31.9,  // 230-239°
    31.9, 32.2, 32.1, 32.1, 32.1, 32.1, 32.2, 32.3, 32.3, 32.3,  // 240-249°
    32.3, 32.4, 32.4, 32.5, 32.6, 32.7, 32.6, 32.8, 32.8, 33.0,  // 250-259°
    33.1, 33.0, 33.2, 33.3, 33.5, 33.5, 33.7, 33.7, 33.9, 33.9,  // 260-269°
    33.9, 33.9, 33.9, 33.9, 33.7, 33.7, 33.8, 33.9, 33.9, 33.8,  // 270-279°
    33.9, 33.7, 33.6, 33.7, 33.6, 33.5, 33.4, 33.3, 33.5, 33.4,  // 280-289°
    33.3, 33.1, 33.0, 33.0, 33.0, 33.0, 32.8, 32.8, 32.7, 32.7,  // 290-299°
    32.7, 32.5, 32.6, 32.3, 32.4, 32.5, 32.3, 32.2, 32.2, 32.0,  // 300-309°
    32.1, 32.0, 31.9, 32.0, 31.8, 32.0, 31.8, 31.7, 31.8, 31.6,  // 310-319°
    31.7, 31.7, 31.5, 31.8, 31.7, 31.6, 31.5, 31.4, 31.4, 31.6,  // 320-329°
    31.6, 31.6, 31.6, 31.5, 31.6, 31.6, 31.6, 31.6, 31.7, 31.4,  // 330-339°
    31.5, 31.6, 31.7, 31.5, 31.6, 31.7, 31.8, 31.7, 31.8, 32.0,  // 340-349°
    31.8, 32.0, 31.9, 32.1, 32.0, 32.2, 32.2, 32.2, 32.1, 32.1   // 350-359°
];

export const getLogoMaxRadiusAtAngle = (angleDeg) => {
    const angle = Math.floor(((angleDeg % 360) + 360) % 360);
    return radiusLookup360[angle] || 32;
};

// 3. Process Videos
export const processedVideos = videosWithHsl.map((v, i) => {
    const angleJitter = (v.originalId % 10 - 4.5) * 0.4;
    const angle = (v.hsl.h + angleJitter + 360) % 360;
    const maxR = getLogoMaxRadiusAtAngle(angle);

    const neighbors = videosWithHsl.filter(other => {
        let diff = Math.abs(other.hsl.h - v.hsl.h);
        if (diff > 180) diff = 360 - diff;
        return diff < 6;
    });
    neighbors.sort((a, b) => b.hsl.l - a.hsl.l);
    const rank = neighbors.findIndex(n => n.originalId === v.originalId);
    const r = (Math.pow(Math.max(0, rank) / neighbors.length, 0.6)) * maxR;

    const angleRad = (angle - 90) * (Math.PI / 180);
    return {
        ...v, id: i, angleDeg: angle, radius: r,
        wheelX: 50 + r * Math.cos(angleRad),
        wheelY: 50 + r * Math.sin(angleRad)
    };
});

// 4. GENERATE PERFECTIONIST NEBULA (Standalone True Hybrid)
export const nebulaIslands = (() => {
    const islands = [];
    const SCAN_RES = 1.0;
    const ANGLE_STEP = 3;
    const RADIAL_STEP = 5;
    const numSectors = Math.ceil(360 / ANGLE_STEP);

    // 4.1. Local Grid Base
    const grid = [];
    for (let s = 0; s < numSectors; s++) {
        grid[s] = Array(Math.ceil(100 / RADIAL_STEP)).fill(null);
    }
    processedVideos.forEach(v => {
        const s = Math.floor(v.angleDeg / ANGLE_STEP) % numSectors;
        const rIdx = Math.floor(v.radius / RADIAL_STEP);
        if (grid[s] && rIdx < grid[s].length) {
            if (grid[s][rIdx] === null) grid[s][rIdx] = { r: 0, g: 0, b: 0, count: 0 };
            const cell = grid[s][rIdx];
            const rgb = hexToRgb(v.color);
            if (rgb && cell) { cell.r += rgb.r; cell.g += rgb.g; cell.b += rgb.b; cell.count++; }
        }
    });

    // Angular Interpolation (Limited range to respect density)
    const MAX_INTER_OFFSET = Math.ceil(45 / ANGLE_STEP);
    for (let s = 0; s < numSectors; s++) {
        for (let r = 0; r < grid[s].length; r++) {
            if (grid[s][r] && grid[s][r].count > 0) continue;
            let leftCell = null, rightCell = null;
            for (let o = 1; o <= MAX_INTER_OFFSET; o++) {
                const ls = (s - o + numSectors) % numSectors;
                if (grid[ls][r] && grid[ls][r].count > 0) { leftCell = grid[ls][r]; break; }
            }
            for (let o = 1; o <= MAX_INTER_OFFSET; o++) {
                const rs = (s + o) % numSectors;
                if (grid[rs][r] && grid[rs][r].count > 0) { rightCell = grid[rs][r]; break; }
            }
            if (leftCell || rightCell) grid[s][r] = { ...(leftCell || rightCell) };
        }
    }

    // 4.2. THE HEART (r < 25): Native implementation of Home Page logic
    for (let s = 0; s < numSectors; s++) {
        for (let r = 0; r < 5; r++) { // 0, 5, 10, 15, 20
            const cell = grid[s][r];
            if (!cell || (cell.count === 0 && !cell.r)) continue;

            const radius = r * RADIAL_STEP;
            const angle = s * ANGLE_STEP;

            // Density Management
            if (radius === 0) { if (s > 0) continue; }
            else if (radius < 15) { if (s % 4 !== 0) continue; }

            // SEED-LEVEL HSL TUNING
            let R = cell.r / (cell.count || 1), G = cell.g / (cell.count || 1), B = cell.b / (cell.count || 1);
            const hsl = rgbToHsl(R, G, B);

            const glowLimit = 5;
            if (radius < glowLimit) {
                const t = Math.pow(radius / glowLimit, 10);
                hsl.s *= t; hsl.l = 98 - (98 - hsl.l) * t;
            } else {
                hsl.s = Math.min(hsl.s * 2.5, 100);
                hsl.l = Math.max(Math.min(hsl.l, 85), 20);
            }
            const tuned = hslToRgb(hsl.h, hsl.s, hsl.l);

            // Jitter
            const jR = (Math.random() - 0.5) * RADIAL_STEP * 0.4;
            const jA = (Math.random() - 0.5) * ANGLE_STEP * 0.4;
            const finalR = radius + jR;
            const finalA = angle + jA;
            const aRad = (finalA - 90) * (Math.PI / 180);

            islands.push({
                x: 50 + finalR * Math.cos(aRad),
                y: 50 + finalR * Math.sin(aRad),
                r: tuned.r, g: tuned.g, b: tuned.b
            });
        }
    }

    // 4.3. THE SHELL (r >= 25): Pure Perfectionist Boundary Logic
    // Augmented Video Set for Influences
    const augmentedVideos = processedVideos.map(v => ({
        wheelX: v.wheelX, wheelY: v.wheelY,
        rgb: hexToRgb(v.color)
    }));
    [30, 45, 60].forEach(angle => {
        const s = Math.floor(angle / ANGLE_STEP) % numSectors;
        const targetR = 50;
        const cell = grid[s][10]; // Sampling grid at r=50
        if (cell && (cell.count > 0 || cell.r)) {
            const aRad = (angle - 90) * (Math.PI / 180);
            augmentedVideos.push({
                wheelX: 50 + targetR * Math.cos(aRad),
                wheelY: 50 + targetR * Math.sin(aRad),
                rgb: { r: cell.r / (cell.count || 1), g: cell.g / (cell.count || 1), b: cell.b / (cell.count || 1) }
            });
        }
    });

    for (let x = 0; x <= 100; x += SCAN_RES) {
        for (let y = 0; y <= 100; y += SCAN_RES) {
            const dx = x - 50, dy = y - 50;
            const distCenter = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
            if (distCenter < 25 || distCenter > getLogoMaxRadiusAtAngle(angle)) continue;

            const sorted = augmentedVideos
                .map(v => ({ v, d2: Math.pow(x - v.wheelX, 2) + Math.pow(y - v.wheelY, 2) }))
                .sort((a, b) => a.d2 - b.d2);

            if (sorted.length < 2) continue;
            const first = sorted[0], second = sorted[1];
            const diff = Math.sqrt(second.d2) - Math.sqrt(first.d2);

            if (diff < 2.5 && Math.random() < 0.25) {
                // Apply same HSL boost to boundary seeds
                const hsl = rgbToHsl(first.v.rgb.r, first.v.rgb.g, first.v.rgb.b);
                hsl.s = Math.min(hsl.s * 2.5, 100);
                hsl.l = Math.max(Math.min(hsl.l, 85), 20);
                const tuned = hslToRgb(hsl.h, hsl.s, hsl.l);

                islands.push({
                    x: x + (Math.random() - 0.5) * 2.5,
                    y: y + (Math.random() - 0.5) * 2.5,
                    r: tuned.r, g: tuned.g, b: tuned.b
                });
            }
        }
    }

    // 4.4. Final Render (N=20 IDW)
    const voronoiCells = [];
    const VORONOI_GRID = 0.5;
    const BLEND_COUNT = 20;

    for (let x = 0; x <= 100; x += VORONOI_GRID) {
        for (let y = 0; y <= 100; y += VORONOI_GRID) {
            const dx = x - 50, dy = y - 50;
            const distCenter = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
            if (distCenter > getLogoMaxRadiusAtAngle(angle)) continue;

            const neighbors = islands
                .map(is => ({ is, d2: Math.pow(x - is.x, 2) + Math.pow(y - is.y, 2) }))
                .sort((a, b) => a.d2 - b.d2)
                .slice(0, BLEND_COUNT);

            let totalW = 0, rB = 0, gB = 0, bB = 0;
            neighbors.forEach(n => {
                const w = 1 / (n.d2 + 12); // LOGOPAGE SMOOTHING
                rB += n.is.r * w; gB += n.is.g * w; bB += n.is.b * w; totalW += w;
            });

            if (totalW > 0) {
                let R = rB / totalW, G = gB / totalW, B = bB / totalW;
                voronoiCells.push({
                    x, y,
                    color: `rgb(${Math.round(R)}, ${Math.round(G)}, ${Math.round(B)})`,
                    size: VORONOI_GRID * 3
                });
            }
        }
    }
    return voronoiCells;
})();
