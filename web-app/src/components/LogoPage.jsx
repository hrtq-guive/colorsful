import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, hslToRgb } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// =============================================================================
// SHAPE-FIRST LOGO NEBULA
// =============================================================================
// Core Axiom: The logo shape defines everything from the start

// 1. Prepare videos with HSL (from Gradient.jsx)
const videosWithHsl = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };
    return { ...v, hsl, originalId: i };
}).filter(v => v.color);

// 2. LOGO SHAPE DEFINITION (Core Axiom)
// 360-degree precision boundary (1° per value)
// EXACT values measured from logo-mask.svg using canvas sampling
const getLogoMaxRadiusAtAngle = (angleDeg) => {
    const angle = Math.floor(((angleDeg % 360) + 360) % 360);

    // Radius values measured from actual logo mask (range: 30.5-35.1)
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

    return radiusLookup360[angle] || 32;
};

// 3. Process Videos with Luminosity Radial Sort (from Gradient.jsx)
const processedVideos = videosWithHsl.map((v, i) => {
    const angleJitter = (v.originalId % 10 - 4.5) * 0.4;
    const angle = (v.hsl.h + angleJitter + 360) % 360;

    // Local radial sorting by lightness
    const neighbors = videosWithHsl.filter(other => {
        let diff = Math.abs(other.hsl.h - v.hsl.h);
        if (diff > 180) diff = 360 - diff;
        return diff < 6;
    });

    neighbors.sort((a, b) => b.hsl.l - a.hsl.l);

    const rank = neighbors.findIndex(n => n.originalId === v.originalId);
    const linearRank = Math.max(0, rank) / neighbors.length;
    const curvedRank = Math.pow(linearRank, 0.6);

    // SHAPE-AWARE MAPPING: Use the actual max radius at this angle
    const maxR = getLogoMaxRadiusAtAngle(angle);
    const r = curvedRank * maxR;

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

// 4. SHAPE-AWARE GRID GENERATION
const nebulaIslands = (() => {
    const ANGLE_STEP = 5;
    const RADIAL_STEP = 8;
    const numSectors = Math.ceil(360 / ANGLE_STEP);

    // Build a SHAPE-AWARE grid
    // Each sector has a different number of rings based on logo shape
    const grid = [];
    for (let s = 0; s < numSectors; s++) {
        const sectorAngle = s * ANGLE_STEP;
        const maxRadiusForSector = getLogoMaxRadiusAtAngle(sectorAngle);
        const numRingsForSector = Math.ceil(maxRadiusForSector / RADIAL_STEP);

        grid[s] = Array(numRingsForSector).fill(null);
    }

    // Place videos into the shape-aware grid
    processedVideos.forEach(v => {
        const sectorIdx = Math.floor(v.angleDeg / ANGLE_STEP) % numSectors;
        const maxRadiusForSector = getLogoMaxRadiusAtAngle(v.angleDeg);
        const numRingsForSector = grid[sectorIdx].length;

        const ringIdx = Math.floor(Math.min(v.radius, maxRadiusForSector - 0.1) / RADIAL_STEP);

        if (ringIdx >= 0 && ringIdx < numRingsForSector) {
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
        }
    });

    // 5. ISLAND GENERATION with Gradient.jsx smoothing
    const islands = [];

    for (let s = 0; s < numSectors; s++) {
        const numRingsForSector = grid[s].length;

        for (let r = 0; r < numRingsForSector; r++) {
            const cell = grid[s][r];
            if (!cell) continue;

            const baseCount = cell.count;

            // Weighted smoothing (from Gradient.jsx)
            let smoothR = (cell.sumR / baseCount) * 0.6;
            let smoothG = (cell.sumG / baseCount) * 0.6;
            let smoothB = (cell.sumB / baseCount) * 0.6;
            let weightSum = 0.6;

            // Neighbors (accounting for variable ring counts)
            const neighbors = [
                grid[(s - 1 + numSectors) % numSectors]?.[r],
                grid[(s + 1) % numSectors]?.[r],
                grid[s]?.[Math.max(0, r - 1)],
                grid[s]?.[Math.min(numRingsForSector - 1, r + 1)]
            ];

            neighbors.forEach(n => {
                if (n) {
                    smoothR += (n.sumR / n.count) * 0.1;
                    smoothG += (n.sumG / n.count) * 0.1;
                    smoothB += (n.sumB / n.count) * 0.1;
                    weightSum += 0.1;
                }
            });

            let R = Math.round(smoothR / weightSum);
            let G = Math.round(smoothG / weightSum);
            let B = Math.round(smoothB / weightSum);

            // Boost vibrancy (from Gradient.jsx)
            const hsl = rgbToHsl(R, G, B);
            if (hsl.s > 0 || hsl.l > 0) {
                hsl.s = Math.min(hsl.s * 1.6, 100);
                hsl.l = Math.max(hsl.l, 15);
                hsl.l = Math.min(hsl.l, 90);

                const boosted = hslToRgb(hsl.h, hsl.s, hsl.l);
                R = boosted.r;
                G = boosted.g;
                B = boosted.b;

                // Size logic with edge decay
                const rRatio = r / numRingsForSector;
                const edgeDecay = rRatio < 0.85 ? 1.0 : Math.max(0, 1 - (rRatio - 0.85) / 0.15);

                let sizeMultiplier = 1.0;
                if (rRatio > 0.6) {
                    if (rRatio > 0.85) {
                        sizeMultiplier = 1.0 + (rRatio - 0.85) * 8;
                    } else {
                        sizeMultiplier = 1.0 + (rRatio - 0.6) * 1.5;
                    }
                }

                const size = (4 + Math.min(baseCount * 0.8, 8)) * edgeDecay * sizeMultiplier;

                islands.push({
                    x: cell.sumX / baseCount,
                    y: cell.sumY / baseCount,
                    color: `rgb(${R}, ${G}, ${B})`,
                    size: size
                });
            }
        }
    }

    // 6. INTERPOLATION - Two-pass approach

    // Pass 1: General gap filling (2+ neighbors)
    for (let s = 0; s < numSectors; s++) {
        const numRingsForSector = grid[s].length;

        for (let r = 0; r < numRingsForSector; r++) {
            if (grid[s][r]) continue;

            const neighbors = [];
            const neighborOffsets = [
                [-1, 0], [1, 0], [0, -1], [0, 1],
                [-1, -1], [-1, 1], [1, -1], [1, 1]
            ];

            for (const [ds, dr] of neighborOffsets) {
                const ns = (s + ds + numSectors) % numSectors;
                const nr = r + dr;
                const neighborSector = grid[ns];
                if (neighborSector && nr >= 0 && nr < neighborSector.length && neighborSector[nr]) {
                    neighbors.push(neighborSector[nr]);
                }
            }

            if (neighbors.length >= 2) {
                let sumR = 0, sumG = 0, sumB = 0, sumX = 0, sumY = 0;

                neighbors.forEach(n => {
                    sumR += n.sumR / n.count;
                    sumG += n.sumG / n.count;
                    sumB += n.sumB / n.count;
                    sumX += n.sumX / n.count;
                    sumY += n.sumY / n.count;
                });

                const avgR = Math.round(sumR / neighbors.length);
                const avgG = Math.round(sumG / neighbors.length);
                const avgB = Math.round(sumB / neighbors.length);

                const hsl = rgbToHsl(avgR, avgG, avgB);
                hsl.s = Math.min(hsl.s * 1.6, 100);
                hsl.l = Math.max(hsl.l, 15);
                hsl.l = Math.min(hsl.l, 90);

                const boosted = hslToRgb(hsl.h, hsl.s, hsl.l);

                const rRatio = r / numRingsForSector;
                const edgeDecay = rRatio < 0.85 ? 1.0 : Math.max(0, 1 - (rRatio - 0.85) / 0.15);

                let sizeMultiplier = 1.0;
                if (rRatio > 0.6) {
                    if (rRatio > 0.85) {
                        sizeMultiplier = 1.0 + (rRatio - 0.85) * 10;
                    } else {
                        sizeMultiplier = 1.0 + (rRatio - 0.6) * 2.0;
                    }
                }

                const size = (5 + neighbors.length * 1.0) * edgeDecay * sizeMultiplier;

                islands.push({
                    x: sumX / neighbors.length,
                    y: sumY / neighbors.length,
                    color: `rgb(${boosted.r}, ${boosted.g}, ${boosted.b})`,
                    size: size
                });

                grid[s][r] = {
                    sumX, sumY,
                    sumR: avgR * neighbors.length,
                    sumG: avgG * neighbors.length,
                    sumB: avgB * neighbors.length,
                    count: neighbors.length
                };
            }
        }
    }

    // Pass 2: Minimal radial extension for sharp edges
    // Extend just 3 rings past the boundary for solid edges without overwhelming colors
    for (let s = 0; s < numSectors; s++) {
        const numRingsForSector = grid[s].length;

        // Find the outermost filled ring
        let lastFilledRing = -1;
        let lastFilledData = null;

        for (let r = numRingsForSector - 1; r >= 0; r--) {
            if (grid[s][r]) {
                lastFilledRing = r;
                lastFilledData = grid[s][r];
                break;
            }
        }

        // Only extend if we found a filled ring near the edge (80%+)
        if (lastFilledRing >= 0 && lastFilledData && (lastFilledRing / numRingsForSector) > 0.8) {
            const baseR = Math.round(lastFilledData.sumR / lastFilledData.count);
            const baseG = Math.round(lastFilledData.sumG / lastFilledData.count);
            const baseB = Math.round(lastFilledData.sumB / lastFilledData.count);

            // Keep color boosting
            const hsl = rgbToHsl(baseR, baseG, baseB);
            hsl.s = Math.min(hsl.s * 1.6, 100);
            hsl.l = Math.max(hsl.l, 15);
            hsl.l = Math.min(hsl.l, 90);
            const boosted = hslToRgb(hsl.h, hsl.s, hsl.l);

            // Extend just 3 rings for sharp edge
            for (let r = lastFilledRing + 1; r < Math.min(lastFilledRing + 4, numRingsForSector + 3); r++) {
                const sectorAngle = (s / numSectors) * 360;
                const angleRad = ((sectorAngle - 90) * Math.PI) / 180;
                const maxRadiusAtAngle = getLogoMaxRadiusAtAngle(sectorAngle);
                const radiusPercent = (r / numRingsForSector) * maxRadiusAtAngle;

                const x = radiusPercent * Math.cos(angleRad);
                const y = radiusPercent * Math.sin(angleRad);

                // Large size for solid coverage
                const size = 15;

                islands.push({
                    x,
                    y,
                    color: `rgb(${boosted.r}, ${boosted.g}, ${boosted.b})`,
                    size: size
                });
            }
        }
    }

    return islands;
})();

const LogoPage = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [lastVideo, setLastVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const [isInsideLogo, setIsInsideLogo] = useState(false);
    const creditTimeoutRef = useRef(null);
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

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => updateVisuals(e, rect));

        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        const dx = mouseX - 50;
        const dy = mouseY - 50;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        const mouseAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
        const maxRadiusAtAngle = getLogoMaxRadiusAtAngle(mouseAngle);

        // Cursor state - exact boundary detection with 360° precision
        // Cursor changes to small exactly when touching the logo border
        const insideBoundary = distFromCenter <= maxRadiusAtAngle;
        setIsInsideLogo(insideBoundary);

        // Interaction guard
        if (distFromCenter > maxRadiusAtAngle + 2) {
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

        if (minDist > 15) {
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
            {/* Branding */}
            <div
                onMouseEnter={() => { setIsBrandingHovered(true); setShowCredit(true); if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current); creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000); }}
                onMouseLeave={() => setIsBrandingHovered(false)}
                onClick={() => { setShowCredit(true); if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current); creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000); }}
                style={{
                    position: 'fixed',
                    top: '30px',
                    left: '30px',
                    color: isBrandingHovered ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3rem',
                    zIndex: 100,
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
            >COLORSFUL</div>

            <div style={{ position: 'fixed', top: '58px', left: '30px', zIndex: 100, opacity: (showCredit && !selectedVideo) ? 1 : 0, pointerEvents: showCredit ? 'auto' : 'none', transition: 'opacity 0.4s ease, transform 0.4s ease', transform: showCredit ? 'translateY(0)' : 'translateY(-10px)' }}>
                <a href="https://www.heretique.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '0.6rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2rem' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.7}>created by hérétique</a>
            </div>

            {/* Logo Container */}
            <div
                ref={wheelRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => hoveredVideo && setSelectedVideo(hoveredVideo)}
                style={{
                    width: '42vmax',
                    height: '42vmax',
                    maskImage: 'url(/logo-mask.svg)',
                    WebkitMaskImage: 'url(/logo-mask.svg)',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    position: 'relative',
                    cursor: 'none',
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s'
                }}
                {...(isInsideLogo && { 'data-cursor': 'small' })}
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

            {/* Artist/Track Info */}
            {hoveredVideo && (
                <>
                    <div style={{
                        position: 'fixed',
                        bottom: '30px',
                        left: '30px',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3rem',
                        zIndex: 100,
                        opacity: selectedVideo ? 0 : 1,
                        transition: 'opacity 0.4s'
                    }}>
                        {parseVideoTitle(hoveredVideo.title).fullArtist}
                    </div>
                    <div style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3rem',
                        zIndex: 100,
                        opacity: selectedVideo ? 0 : 1,
                        transition: 'opacity 0.4s'
                    }}>
                        {parseVideoTitle(hoveredVideo.title).songTitle}
                    </div>
                </>
            )}

            {/* Replay Last Video */}
            {lastVideo && !hoveredVideo && !selectedVideo && (
                <div
                    onClick={() => setSelectedVideo(lastVideo)}
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3rem',
                        zIndex: 100,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#fff'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                >
                    REPLAY LAST VIDEO
                </div>
            )}

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

export default LogoPage;
