import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, hslToRgb } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// 1. Prepare videos with HSL
const videosWithHsl = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };
    return { ...v, hsl, originalId: i };
}).filter(v => v.color);

// 2. Density Profiling
// We want to know how "dense" each angular sector is to deform the wheel.
const SECTOR_SIZE = 5; // Degrees per bin
const NUM_SECTORS = 360 / SECTOR_SIZE;
const densityHistogram = new Array(NUM_SECTORS).fill(0);

// Fill Histogram
videosWithHsl.forEach(v => {
    const sector = Math.floor(v.hsl.h / SECTOR_SIZE) % NUM_SECTORS;
    densityHistogram[sector]++;
});

// Smooth Histogram (Moving Average) to get organic shape
const SMOOTHING_WINDOW = 4; // adjacent sectors to average
const radiusProfile = densityHistogram.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let offset = -SMOOTHING_WINDOW; offset <= SMOOTHING_WINDOW; offset++) {
        let index = (i + offset + NUM_SECTORS) % NUM_SECTORS;
        sum += densityHistogram[index];
        count++;
    }
    const avgDensity = sum / count;

    // Map Density to Radius % (e.g., Min 25%, Max 48%)
    // Adjust these min/max values to control distortion intensity
    return 25 + Math.min(avgDensity * 3.5, 23);
});

// Helper to get max radius at specific angle
const getMaxRadiusAtAngle = (angle) => {
    const sector = Math.floor(((angle % 360) + 360) % 360 / SECTOR_SIZE);
    return radiusProfile[sector];
};

// 3. Process Videos with "Luminosity Radial Sort"
// - Angle: Natural Hue
// - Radius: Determined by Lightness Rank (Dark -> Center, Light -> Edge)
const processedVideos = videosWithHsl.map((v, i) => {
    // 3a. Natural Angle
    const angleJitter = (v.originalId % 10 - 4.5) * 0.4;
    const angle = (v.hsl.h + angleJitter + 360) % 360;

    // 3b. Local Radial Sorting: Lightness = Radius
    // Filter neighbors (approx +/- 6 deg for tight correlation)
    const neighbors = videosWithHsl.filter(other => {
        let diff = Math.abs(other.hsl.h - v.hsl.h);
        if (diff > 180) diff = 360 - diff;
        return diff < 6;
    });

    // Sort neighbors by Lightness (Brightest First -> Center, Darkest Last -> Edge)
    neighbors.sort((a, b) => b.hsl.l - a.hsl.l);

    const rank = neighbors.findIndex(n => n.originalId === v.originalId);
    // Use root distribution (exponent < 1) to push colors OUT and squeeze Darks to the Edge
    const linearRank = Math.max(0, rank) / neighbors.length;
    const curvedRank = Math.pow(linearRank, 0.6); // Slightly expanded curve

    // 3c. Calculate final position
    const maxR = getMaxRadiusAtAngle(angle);
    const minR = 0; // Start from absolute center (Black Hole)

    // Linear mapping of Lightness Rank to Radius
    const r = minR + curvedRank * (maxR - minR);

    const angleRad = (angle - 90) * (Math.PI / 180);

    return {
        ...v,
        id: i,
        angleDeg: angle,
        wheelX: 50 + r * Math.cos(angleRad),
        wheelY: 50 + r * Math.sin(angleRad),
        radius: r
    };
});

// 4. Generating Nebula Islands (Data Clusters)
// We group videos into spatial bins to create "Average Color" orbs
const nebulaIslands = (() => {
    const ANGLE_STEP = 5;
    const RADIAL_STEP = 8;
    const numSectors = Math.ceil(360 / ANGLE_STEP);
    const numRings = Math.ceil(50 / RADIAL_STEP);

    // 1. Build Raw Grid
    const grid = Array(numSectors).fill().map(() => Array(numRings).fill(null));

    processedVideos.forEach(v => {
        const sectorIdx = Math.floor(v.angleDeg / ANGLE_STEP) % numSectors;
        const ringIdx = Math.floor(Math.min(v.radius, 49.9) / RADIAL_STEP); // 0 to numRings-1

        if (!grid[sectorIdx][ringIdx]) {
            grid[sectorIdx][ringIdx] = {
                sumX: 0, sumY: 0, sumR: 0, sumG: 0, sumB: 0, count: 0
            };
        }

        const cell = grid[sectorIdx][ringIdx];
        cell.sumX += v.wheelX;
        cell.sumY += v.wheelY;
        cell.count++;

        const rgb = hexToRgb(v.color);
        if (rgb) {
            cell.sumR += rgb.r;
            cell.sumG += rgb.g;
            cell.sumB += rgb.b;
        }
    });

    // 2. Smooth & Flatten
    const islands = [];

    for (let s = 0; s < numSectors; s++) {
        for (let r = 0; r < numRings; r++) {
            const cell = grid[s][r];
            if (!cell) continue;

            const baseCount = cell.count;
            // Start with Self
            let smoothR = (cell.sumR / baseCount) * 0.6;
            let smoothG = (cell.sumG / baseCount) * 0.6;
            let smoothB = (cell.sumB / baseCount) * 0.6;
            let weightSum = 0.6;

            // Neighbors: Left, Right, In, Out
            const neighbors = [
                grid[(s - 1 + numSectors) % numSectors][r], // Left
                grid[(s + 1) % numSectors][r],             // Right
                grid[s][Math.max(0, r - 1)],               // In
                grid[s][Math.min(numRings - 1, r + 1)]     // Out
            ];

            neighbors.forEach(n => {
                if (n) {
                    smoothR += (n.sumR / n.count) * 0.1;
                    smoothG += (n.sumG / n.count) * 0.1;
                    smoothB += (n.sumB / n.count) * 0.1;
                    weightSum += 0.1;
                }
            });

            // Normalize
            let R = Math.round(smoothR / weightSum);
            let G = Math.round(smoothG / weightSum);
            let B = Math.round(smoothB / weightSum);

            // Boost Vibrancy & Lightness to reveal Dark Colors
            const hsl = rgbToHsl(R, G, B);
            if (hsl.s > 0 || hsl.l > 0) {
                hsl.s = Math.min(hsl.s * 1.6, 100); // Stronger saturation boost

                // VISIBILITY RESTORED:
                // Darker Floor (15%) to respect original colors while ensuring visibility.
                hsl.l = Math.max(hsl.l, 15);

                // Soft ceiling
                hsl.l = Math.min(hsl.l, 90);

                const boosted = hslToRgb(hsl.h, hsl.s, hsl.l);
                R = boosted.r;
                G = boosted.g;
                B = boosted.b;

                // Size based on count, with Delayed Decay (Solid until 85%, then dissolve)
                const edgeDecay = (r / numRings) < 0.85 ? 1.0 : Math.max(0, 1 - ((r / numRings) - 0.85) / 0.15);
                // OVERLAP BOOST: Larger size (12-25px) to ensure holes are filled (Interpolation effect)
                const size = (12 + Math.min(baseCount * 1.5, 25)) * edgeDecay;

                islands.push({
                    x: cell.sumX / baseCount,
                    y: cell.sumY / baseCount,
                    color: `rgb(${R}, ${G}, ${B})`, // Solid visible color
                    size: size
                });
            }
        }
    }

    return islands;
})();

// Organic shape based on the density profile
function generateOrganicShape() {
    const points = [];
    for (let i = 0; i < 360; i += 5) {
        // Get the Max Radius defined by our profile
        // Add a small buffer (e.g., +2%) to ensure dots don't clip strict edge
        const r = getMaxRadiusAtAngle(i) + 2;

        const angleRad = (i - 90) * (Math.PI / 180);
        const x = 50 + r * Math.cos(angleRad);
        const y = 50 + r * Math.sin(angleRad);
        points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    }
    return `polygon(${points.join(', ')})`;
}

const Gradient = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const wheelRef = useRef(null);
    const requestRef = useRef(null);

    const updateVisuals = (e, rect) => {
        if (!wheelRef.current) return;
        wheelRef.current.style.setProperty('--local-x', `${e.clientX - rect.left}px`);
        wheelRef.current.style.setProperty('--local-y', `${e.clientY - rect.top}px`);
    };

    const handleMouseMove = (e) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();

        // Update visuals via RAF
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => updateVisuals(e, rect));

        // Spatial matching logic
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        const dx = mouseX - 50;
        const dy = mouseY - 50;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        // Guard: mouse must be within the interactive zone
        if (distFromCenter > 50) {
            if (hoveredVideo) setHoveredVideo(null);
            return;
        }

        let closest = null;
        let minDist = Infinity;

        for (const video of processedVideos) {
            const d = Math.sqrt(Math.pow(mouseX - video.wheelX, 2) + Math.pow(mouseY - video.wheelY, 2));
            if (d < minDist) {
                minDist = d;
                closest = video;
            }
        }

        // Distance threshold to avoid "sticky" hover from too far
        // Relaxed influence zone (20%) to capture "filled holes"
        if (minDist > 20) {
            if (hoveredVideo) setHoveredVideo(null);
            return;
        }

        if (closest && (!hoveredVideo || closest.id !== hoveredVideo.id)) {
            setHoveredVideo(closest);
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: selectedVideo ? selectedVideo.color : (hoveredVideo ? hoveredVideo.color : '#0a0a0a'),
            transition: 'background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* COLORSFUL - Top Left */}
            <div
                style={{
                    position: 'fixed',
                    top: '30px',
                    left: '30px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3rem',
                    zIndex: 100,
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                }}
            >
                COLORSFUL
            </div>

            {/* Density Note */}
            <div style={{
                position: 'fixed',
                top: '60px',
                left: '30px',
                color: 'rgba(255, 255, 255, 0.2)',
                fontSize: '0.6rem',
                fontWeight: '400',
                textTransform: 'uppercase',
                letterSpacing: '0.1rem',
                zIndex: 100,
                opacity: selectedVideo ? 0 : 1
            }}>
                Constant Density Mesh / Equal real-estate per video
            </div>

            {/* Centered Wheel */}
            <div
                ref={wheelRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => hoveredVideo && setSelectedVideo(hoveredVideo)}
                style={{
                    width: '35vmax',
                    height: '35vmax',
                    // background: Removed to allow transparency through to page background
                    clipPath: generateOrganicShape(),
                    WebkitClipPath: generateOrganicShape(),
                    position: 'relative',
                    cursor: 'none',
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s',
                    '--local-x': '50%',
                    '--local-y': '50%'
                }}
                data-cursor="small"
            >
                {/* Nebula Layer */}
                <div style={{ position: 'absolute', inset: 0, filter: 'blur(20px)', opacity: 1.0 }}>
                    {nebulaIslands.map((island, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: `${island.x}%`,
                            top: `${island.y}%`,
                            width: `${island.size}%`,
                            height: `${island.size}%`,
                            background: island.color,
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%'
                        }} />
                    ))}
                </div>

            </div>

            {/* Video Info */}
            <div style={{
                position: 'fixed',
                bottom: '40px',
                textAlign: 'center',
                opacity: (hoveredVideo && !selectedVideo) ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                zIndex: 100
            }}>
                {hoveredVideo && (
                    <>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4rem',
                            marginBottom: '10px'
                        }}>
                            {parseVideoTitle(hoveredVideo.title).fullArtist}
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '400',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2rem',
                            opacity: 0.6
                        }}>
                            {parseVideoTitle(hoveredVideo.title).songTitle}
                        </div>
                    </>
                )}
            </div>

            {selectedVideo && (
                <VideoModal
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    backdropColor="transparent"
                />
            )}
        </div>
    );
};



export default Gradient;
