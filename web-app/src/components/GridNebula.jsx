import React, { useState, useMemo } from 'react';
import { processedVideos } from '../utils/nebulaConfig';
import { useVideo } from '../contexts/VideoContext';
import { parseVideoTitle } from '../utils/titleParser';
import { ASSET_BASE_URL } from '../config/assets';
import { hexToRgb, rgbToHsl, hslToRgb } from '../utils/color';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 20000;

// Helper to convert RGB to hex
const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

// Place videos based on color affinity (like homepage color wheel but in 2D space)
const distributeVideosByColor = (videos, width, height) => {
    return videos.map((video, i) => {
        const rgb = hexToRgb(video.color);
        const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 50 };

        // Map hue (0-360) to X position
        const x = (hsl.h / 360) * width;

        // Map saturation/lightness to Y position
        // High saturation = top, low saturation = bottom
        // Lightness adds variation within saturation bands
        const yBase = height * (1 - hsl.s / 100);
        const yOffset = (hsl.l - 50) * 2; // -100 to +100
        const y = yBase + yOffset;

        return {
            video,
            x: Math.max(0, Math.min(width, x)),
            y: Math.max(0, Math.min(height, y)),
            color: video.color,
            hsl,
            isReal: true
        };
    });
};

// Add synthetic seeds to fill gaps (like homepage)
const addSyntheticSeeds = (videoSeeds, width, height) => {
    const synthetic = [];
    const gridSize = 150;

    for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
            // Find nearest real video seeds
            const nearest = videoSeeds
                .map(seed => ({
                    seed,
                    dist: Math.sqrt(Math.pow(x - seed.x, 2) + Math.pow(y - seed.y, 2))
                }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 3);

            // Blend colors of nearest seeds
            if (nearest.length > 0) {
                const totalDist = nearest.reduce((sum, n) => sum + n.dist, 0);
                let r = 0, g = 0, b = 0;

                nearest.forEach(n => {
                    const weight = (1 - n.dist / totalDist) / nearest.length;
                    const rgb = hexToRgb(n.seed.color);
                    if (rgb) {
                        r += rgb.r * weight;
                        g += rgb.g * weight;
                        b += rgb.b * weight;
                    }
                });

                const blendedColor = rgbToHex(Math.round(r), Math.round(g), Math.round(b));

                synthetic.push({
                    x: x + (Math.random() - 0.5) * gridSize * 0.5,
                    y: y + (Math.random() - 0.5) * gridSize * 0.5,
                    color: blendedColor,
                    isReal: false
                });
            }
        }
    }

    return [...videoSeeds, ...synthetic];
};

// Generate Voronoi cells
const generateVoronoi = (seeds, width, height) => {
    return seeds.map(seed => {
        const boundaryPoints = [];
        const numAngles = 20;

        for (let a = 0; a < numAngles; a++) {
            const angle = (a / numAngles) * Math.PI * 2;
            let minDist = 10;
            let maxDist = 400;

            for (let iter = 0; iter < 12; iter++) {
                const testDist = (minDist + maxDist) / 2;
                const testX = seed.x + Math.cos(angle) * testDist;
                const testY = seed.y + Math.sin(angle) * testDist;

                let nearestSeed = seed;
                let nearestDist = Infinity;

                for (const other of seeds) {
                    const dx = testX - other.x;
                    const dy = testY - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestSeed = other;
                    }
                }

                if (nearestSeed === seed) {
                    minDist = testDist;
                } else {
                    maxDist = testDist;
                }
            }

            boundaryPoints.push({
                x: Math.max(0, Math.min(width, seed.x + Math.cos(angle) * minDist)),
                y: Math.max(0, Math.min(height, seed.y + Math.sin(angle) * minDist))
            });
        }

        return { ...seed, polygon: boundaryPoints };
    });
};

const GridNebula = () => {
    const { openVideo, setOriginRoute } = useVideo();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const { cells, videoSeeds } = useMemo(() => {
        console.log('Building color-affinity Voronoi landscape...');

        // 1. Place videos by color
        const videoSeeds = distributeVideosByColor(processedVideos, CANVAS_WIDTH, CANVAS_HEIGHT);
        console.log(`Placed ${videoSeeds.length} videos by color affinity`);

        // 2. Add synthetic interpolation seeds
        const allSeeds = addSyntheticSeeds(videoSeeds, CANVAS_WIDTH, CANVAS_HEIGHT);
        console.log(`Added synthetic seeds, total: ${allSeeds.length}`);

        // 3. Generate Voronoi
        const cells = generateVoronoi(allSeeds, CANVAS_WIDTH, CANVAS_HEIGHT);
        console.log(`Generated ${cells.length} Voronoi cells`);

        return { cells, videoSeeds };
    }, []);

    const handleCellClick = (cell) => {
        if (cell.isReal) {
            setOriginRoute('/gridnebula');
            openVideo(cell.video, { backdropColor: 'transparent' });
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'auto',
            background: '#0a0a0a'
        }}>
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 200,
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 30px'
            }}>
                <div style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    color: 'rgba(255,255,255,0.6)'
                }}>
                    Grid Nebula — Color Landscape
                </div>
            </div>

            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block', margin: '0 auto' }}>
                {cells.map((cell, index) => {
                    const isHovered = hoveredIndex === index;
                    const pathD = cell.polygon.map((p, i) =>
                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                    ).join(' ') + ' Z';

                    return (
                        <g key={index}>
                            <path
                                d={pathD}
                                fill={cell.color}
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth="1"
                                style={{
                                    cursor: cell.isReal ? 'pointer' : 'default',
                                    opacity: isHovered ? 0.85 : 1,
                                    transition: 'opacity 0.3s'
                                }}
                                onMouseEnter={() => cell.isReal && setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onClick={() => handleCellClick(cell)}
                            />

                            {cell.isReal && cell.video && (
                                <foreignObject
                                    x={cell.x - 50}
                                    y={cell.y - 50}
                                    width="100"
                                    height="100"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                            src={isHovered
                                                ? `${ASSET_BASE_URL}captures/${cell.video.url.split('v=')[1]?.split('&')[0]}_45s.gif`
                                                : `${ASSET_BASE_URL}captures/${cell.video.url.split('v=')[1]?.split('&')[0]}_45s.jpg`
                                            }
                                            alt={cell.video.title}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '2px solid rgba(0,0,0,0.4)',
                                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                                            }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                </foreignObject>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default GridNebula;
