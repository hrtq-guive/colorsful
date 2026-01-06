/**
 * Voronoi diagram generator for GridNebula
 * Generates smooth, organic Voronoi cells from seed points
 */

/**
 * Generates Voronoi diagram from seeds
 * @param {Array} seeds - Array of {x, y, color, video?} objects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Array} Array of Voronoi cells with polygons
 */
export function generateVoronoi(seeds, width, height) {
    // Simple Voronoi using distance-based cell assignment
    // For production, consider using d3-delaunay for better performance

    const cells = seeds.map(seed => ({
        ...seed,
        polygon: []
    }));

    // Grid-based approach for simplicity
    const resolution = 20; // pixels per sample
    const cols = Math.ceil(width / resolution);
    const rows = Math.ceil(height / resolution);

    // Create grid of points and assign to nearest seed
    const grid = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * resolution;
            const y = row * resolution;

            // Find nearest seed
            let nearestSeed = seeds[0];
            let minDist = Infinity;

            for (const seed of seeds) {
                const dx = x - seed.x;
                const dy = y - seed.y;
                const dist = dx * dx + dy * dy; // squared distance is fine for comparison
                if (dist < minDist) {
                    minDist = dist;
                    nearestSeed = seed;
                }
            }

            grid.push({ x, y, seed: nearestSeed });
        }
    }

    // Extract boundaries for each cell
    cells.forEach(cell => {
        const cellPoints = grid.filter(p => p.seed === cell);
        if (cellPoints.length === 0) return;

        // Find bounding box
        const xs = cellPoints.map(p => p.x);
        const ys = cellPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Create simple polygon from bounding box
        // For better results, use convex hull or marching squares
        cell.polygon = [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY }
        ];

        cell.bounds = { minX, maxX, minY, maxY };
    });

    return cells;
}

/**
 * Smooths polygon points using Catmull-Rom splines
 * @param {Array} points - Array of {x, y} points
 * @param {number} tension - Spline tension (0-1)
 * @returns {string} SVG path string
 */
export function smoothPolygon(points, tension = 0.5) {
    if (points.length < 3) return '';

    const path = [];
    path.push(`M ${points[0].x} ${points[0].y}`);

    for (let i = 0; i < points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length];
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 2) % points.length];

        // Catmull-Rom to Bezier conversion
        const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
        const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

        path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }

    path.push('Z');
    return path.join(' ');
}

/**
 * Blends two colors
 * @param {string} color1 - Hex color
 * @param {string} color2 - Hex color  
 * @param {number} ratio - Blend ratio (0-1)
 * @returns {string} Blended hex color
 */
export function blendColors(color1, color2, ratio = 0.5) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
