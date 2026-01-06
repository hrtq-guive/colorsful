/**
 * Distributes video seeds across a vertical canvas using Poisson disc sampling
 * for even, organic spacing
 */

/**
 * Poisson disc sampling for even distribution
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} minDistance - Minimum distance between points
 * @param {number} maxAttempts - Max attempts to place each point
 * @returns {Array<{x: number, y: number}>} Array of seed positions
 */
function poissonDiscSampling(width, height, minDistance, maxAttempts = 30) {
    const cellSize = minDistance / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Array(gridWidth * gridHeight).fill(null);
    const active = [];
    const points = [];

    // Helper to get grid index
    const getGridIndex = (x, y) => {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        return row * gridWidth + col;
    };

    // Helper to check if point is valid
    const isValidPoint = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Check neighboring cells
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                const neighborCol = col + i;
                const neighborRow = row + j;
                if (neighborCol >= 0 && neighborCol < gridWidth &&
                    neighborRow >= 0 && neighborRow < gridHeight) {
                    const neighborIndex = neighborRow * gridWidth + neighborCol;
                    const neighbor = grid[neighborIndex];
                    if (neighbor) {
                        const dx = x - neighbor.x;
                        const dy = y - neighbor.y;
                        if (dx * dx + dy * dy < minDistance * minDistance) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    };

    // Start with random point
    const firstPoint = {
        x: Math.random() * width,
        y: Math.random() * height
    };
    points.push(firstPoint);
    active.push(firstPoint);
    grid[getGridIndex(firstPoint.x, firstPoint.y)] = firstPoint;

    // Generate points
    while (active.length > 0) {
        const randomIndex = Math.floor(Math.random() * active.length);
        const point = active[randomIndex];
        let found = false;

        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = minDistance + Math.random() * minDistance;
            const newX = point.x + radius * Math.cos(angle);
            const newY = point.y + radius * Math.sin(angle);

            if (isValidPoint(newX, newY)) {
                const newPoint = { x: newX, y: newY };
                points.push(newPoint);
                active.push(newPoint);
                grid[getGridIndex(newX, newY)] = newPoint;
                found = true;
                break;
            }
        }

        if (!found) {
            active.splice(randomIndex, 1);
        }
    }

    return points;
}

/**
 * Distributes videos across canvas as seeds
 * @param {Array} videos - Array of video objects with color property
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Array<{video, x, y, color}>} Array of video seeds with positions
 */
export function distributeVideoSeeds(videos, canvasWidth = 1200, canvasHeight = 20000) {
    // Calculate minimum distance based on number of videos and canvas size
    const area = canvasWidth * canvasHeight;
    const avgArea = area / videos.length;
    const minDistance = Math.sqrt(avgArea) * 0.8; // 80% of average spacing

    // Generate seed positions
    const positions = poissonDiscSampling(canvasWidth, canvasHeight, minDistance);

    // Shuffle videos for random distribution
    const shuffledVideos = [...videos].sort(() => Math.random() - 0.5);

    // Map videos to positions (take only as many as we have positions)
    const seeds = positions.slice(0, videos.length).map((pos, i) => ({
        video: shuffledVideos[i],
        x: pos.x,
        y: pos.y,
        color: shuffledVideos[i].color
    }));

    return seeds;
}

/**
 * Adds synthetic seeds to fill gaps in the Voronoi diagram
 * @param {Array} videoSeeds - Existing video seeds
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} density - How many synthetic seeds to add (0-1)
 * @returns {Array} Combined array of video and synthetic seeds
 */
export function addSyntheticSeeds(videoSeeds, canvasWidth, canvasHeight, density = 0.5) {
    const syntheticCount = Math.floor(videoSeeds.length * density);
    const minDistance = 80; // Minimum distance between synthetic seeds

    const synthetic = poissonDiscSampling(canvasWidth, canvasHeight, minDistance)
        .slice(0, syntheticCount)
        .map(pos => {
            // Find nearest video seed to inherit color
            let nearestSeed = videoSeeds[0];
            let minDist = Infinity;

            for (const seed of videoSeeds) {
                const dx = pos.x - seed.x;
                const dy = pos.y - seed.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearestSeed = seed;
                }
            }

            return {
                x: pos.x,
                y: pos.y,
                color: nearestSeed.color,
                isSynthetic: true
            };
        });

    return [...videoSeeds, ...synthetic];
}
