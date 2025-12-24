import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, hslToRgb } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// =============================================================================
// PREVIOUS HOME LOGIC (N=20 IDW Watercolor)
// =============================================================================

// 1. Prepare videos with HSL
const videosWithHsl = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };
    return { ...v, hsl, originalId: i };
}).filter(v => v.color);

// 2. LOGO SHAPE DEFINITION
const radiusLookup360 = [
    32.1, 32.4, 32.1, 32.2, 32.2, 32.2, 32.3, 32.3, 32.4, 32.3,
    32.3, 32.2, 32.3, 32.2, 32.3, 32.2, 32.1, 32.1, 32.2, 32.1,
    32.3, 32.3, 32.2, 32.2, 32.2, 32.2, 32.2, 32.2, 32.4, 32.4,
    32.5, 32.5, 32.6, 32.6, 32.7, 32.8, 32.9, 33.0, 32.8, 33.0,
    33.1, 33.3, 33.4, 33.3, 33.5, 33.7, 33.9, 33.9, 34.1, 34.1,
    34.4, 34.4, 34.7, 34.7, 34.7, 34.9, 35.1, 35.0, 35.1, 35.1,
    34.8, 34.7, 34.7, 34.4, 34.4, 34.1, 34.1, 33.8, 33.6, 33.3,
    33.4, 33.2, 33.0, 32.8, 32.6, 32.5, 32.3, 32.2, 32.1, 32.0,
    31.8, 31.8, 31.7, 31.6, 31.5, 31.5, 31.4, 31.2, 31.1, 31.1,
    31.1, 30.9, 30.9, 30.9, 30.7, 30.7, 30.8, 30.8, 30.7, 30.7,
    30.6, 30.7, 30.6, 30.6, 30.5, 30.7, 30.5, 30.7, 30.6, 30.8,
    30.7, 30.6, 30.9, 30.8, 30.8, 30.7, 31.0, 31.0, 31.0, 31.0,
    31.0, 31.1, 31.1, 31.1, 31.2, 31.3, 31.3, 31.4, 31.5, 31.7,
    31.8, 31.8, 31.9, 32.1, 32.1, 32.3, 32.5, 32.4, 32.7, 33.0,
    32.9, 33.2, 33.4, 33.4, 33.5, 33.7, 33.7, 33.8, 33.7, 33.7,
    33.6, 33.6, 33.3, 33.2, 33.2, 33.0, 33.0, 32.7, 32.7, 32.8,
    32.6, 32.6, 32.7, 32.5, 32.6, 32.7, 32.6, 32.7, 32.8, 32.7,
    32.6, 32.5, 32.4, 32.6, 32.5, 32.5, 32.4, 32.4, 32.4, 32.4,
    32.1, 32.1, 32.1, 32.2, 32.2, 32.2, 32.0, 32.1, 32.2, 32.0,
    32.1, 32.1, 32.1, 32.2, 32.1, 32.2, 32.1, 32.1, 32.2, 32.1,
    32.1, 32.3, 32.2, 32.2, 32.3, 32.2, 32.4, 32.4, 32.4, 32.4,
    32.2, 32.3, 32.3, 32.3, 32.4, 32.5, 32.3, 32.4, 32.3, 32.3,
    32.1, 32.2, 32.1, 32.1, 32.1, 32.0, 32.1, 32.0, 31.9, 32.0,
    31.8, 32.0, 31.9, 31.8, 32.0, 31.9, 32.0, 31.9, 32.0, 31.9,
    31.9, 32.2, 32.1, 32.1, 32.1, 32.1, 32.2, 32.3, 32.3, 32.3,
    32.3, 32.4, 32.4, 32.5, 32.6, 32.7, 32.6, 32.8, 32.8, 33.0,
    33.1, 33.0, 33.2, 33.3, 33.5, 33.5, 33.7, 33.7, 33.9, 33.9,
    33.9, 33.9, 33.9, 33.9, 33.7, 33.7, 33.8, 33.9, 33.9, 33.8,
    33.9, 33.7, 33.6, 33.7, 33.6, 33.5, 33.4, 33.3, 33.5, 33.4,
    33.3, 33.1, 33.0, 33.0, 33.0, 33.0, 32.8, 32.8, 32.7, 32.7,
    32.7, 32.5, 32.6, 32.3, 32.4, 32.5, 32.3, 32.2, 32.2, 32.0,
    32.1, 32.0, 31.9, 32.0, 31.8, 32.0, 31.8, 31.7, 31.8, 31.6,
    31.7, 31.7, 31.5, 31.8, 31.7, 31.6, 31.5, 31.4, 31.4, 31.6,
    31.6, 31.6, 31.6, 31.5, 31.6, 31.6, 31.6, 31.6, 31.7, 31.4,
    31.5, 31.6, 31.7, 31.5, 31.6, 31.7, 31.8, 31.7, 31.8, 32.0,
    31.8, 32.0, 31.9, 32.1, 32.0, 32.2, 32.2, 32.2, 32.1, 32.1
];

const getLogoMaxRadiusAtAngle = (angleDeg) => {
    const angle = Math.floor(((angleDeg % 360) + 360) % 360);
    return radiusLookup360[angle] || 32;
};

// 3. Process Videos
const processedVideos = videosWithHsl.map((v, i) => {
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

// 4. GENERATE WATERCOLOR NEBULA (Original Home Page Logic)
const nebulaIslands = (() => {
    const islands = [];
    const ANGLE_STEP = 3;
    const RADIAL_STEP = 5;
    const numSectors = Math.ceil(360 / ANGLE_STEP);

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

    for (let s = 0; s < numSectors; s++) {
        for (let r = 0; r < grid[s].length; r++) {
            const cell = grid[s][r];
            if (!cell || (cell.count === 0 && !cell.r)) continue;

            const radius = r * RADIAL_STEP;
            const angle = s * ANGLE_STEP;

            if (radius === 0) { if (s > 0) continue; }
            else if (radius < 15) { if (s % 4 !== 0) continue; }

            const jR = (Math.random() - 0.5) * RADIAL_STEP * 0.4;
            const jA = (Math.random() - 0.5) * ANGLE_STEP * 0.4;
            const finalR = radius + jR;
            const finalA = angle + jA;
            const aRad = (finalA - 90) * (Math.PI / 180);

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
            const finalRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

            islands.push({
                x: 50 + finalR * Math.cos(aRad),
                y: 50 + finalR * Math.sin(aRad),
                color: `rgb(${Math.round(finalRgb.r)}, ${Math.round(finalRgb.g)}, ${Math.round(finalRgb.b)})`
            });
        }
    }

    const voronoiCells = [];
    const VORONOI_GRID = 0.5;
    const BLEND_COUNT = 20;

    for (let x = 0; x <= 100; x += VORONOI_GRID) {
        for (let y = 0; y <= 100; y += VORONOI_GRID) {
            const dx = x - 50, dy = y - 50;
            const radius = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
            if (radius > getLogoMaxRadiusAtAngle(angle)) continue;

            const neighbors = islands
                .map(is => ({ is, d2: Math.pow(x - is.x, 2) + Math.pow(y - is.y, 2) }))
                .sort((a, b) => a.d2 - b.d2)
                .slice(0, BLEND_COUNT);

            let totalW = 0, rB = 0, gB = 0, bB = 0;
            neighbors.forEach(n => {
                const w = 1 / (n.d2 + 12);
                const rgb = n.is.color.match(/\d+/g).map(Number);
                rB += rgb[0] * w; gB += rgb[1] * w; bB += rgb[2] * w; totalW += w;
            });

            if (totalW > 0) {
                voronoiCells.push({
                    x, y,
                    color: `rgb(${Math.round(rB / totalW)}, ${Math.round(gB / totalW)}, ${Math.round(bB / totalW)})`,
                    size: VORONOI_GRID * 3
                });
            }
        }
    }
    return voronoiCells;
})();

const PreviousHomePage = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [lastVideo, setLastVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const [isInsideLogo, setIsInsideLogo] = useState(false);
    const creditTimeoutRef = useRef(null);
    const wheelRef = useRef(null);
    const voronoiCanvasRef = useRef(null);

    useEffect(() => {
        const canvas = voronoiCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;

        nebulaIslands.forEach(cell => {
            const x = (cell.x / 100) * rect.width;
            const y = (cell.y / 100) * rect.height;
            const size = (cell.size / 100) * rect.width;
            ctx.fillStyle = cell.color;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [nebulaIslands]);

    const handleMouseMove = (e) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        const dx = mouseX - 50, dy = mouseY - 50;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

        setIsInsideLogo(dist <= getLogoMaxRadiusAtAngle(angle));

        if (dist > getLogoMaxRadiusAtAngle(angle) + 2) {
            if (hoveredVideo) setHoveredVideo(null);
            return;
        }

        let closest = null, minDist = Infinity;
        processedVideos.forEach(v => {
            const d = Math.sqrt(Math.pow(mouseX - v.wheelX, 2) + Math.pow(mouseY - v.wheelY, 2));
            if (d < minDist) { minDist = d; closest = v; }
        });

        if (minDist < 15 && (!hoveredVideo || closest.id !== hoveredVideo.id)) setHoveredVideo(closest);
        else if (minDist >= 15 && hoveredVideo) setHoveredVideo(null);
    };

    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: selectedVideo ? selectedVideo.color : (hoveredVideo ? hoveredVideo.color : '#0a0a0a'),
            transition: 'background-color 0.4s ease',
            color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: "'Inter', sans-serif", overflow: 'hidden'
        }}>
            <div
                onMouseEnter={() => { setIsBrandingHovered(true); setShowCredit(true); clearTimeout(creditTimeoutRef.current); creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000); }}
                onMouseLeave={() => setIsBrandingHovered(false)}
                onClick={() => { setShowCredit(true); clearTimeout(creditTimeoutRef.current); creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000); }}
                style={{
                    position: 'fixed', top: '30px', left: '30px',
                    color: isBrandingHovered ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: '0.3rem', zIndex: 100, opacity: selectedVideo ? 0 : 1, transition: 'all 0.3s ease', cursor: 'pointer'
                }}
            >COLORSFUL</div>

            <div style={{ position: 'fixed', top: '58px', left: '30px', zIndex: 100, opacity: (showCredit && !selectedVideo) ? 1 : 0, pointerEvents: showCredit ? 'auto' : 'none', transition: 'opacity 0.4s ease', transform: showCredit ? 'translateY(0)' : 'translateY(-10px)' }}>
                <a href="https://www.heretique.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '0.6rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2rem' }}>created by hérétique</a>
            </div>

            <div
                ref={wheelRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => hoveredVideo && setSelectedVideo(hoveredVideo)}
                style={{
                    width: '42vmax', height: '42vmax',
                    maskImage: 'url(/logo-mask.svg)', WebkitMaskImage: 'url(/logo-mask.svg)',
                    maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center', WebkitMaskPosition: 'center', position: 'relative', cursor: 'none',
                    opacity: selectedVideo ? 0 : 1, transition: 'opacity 0.4s'
                }}
                {...(isInsideLogo && { 'data-cursor': 'small' })}
            >
                <canvas ref={voronoiCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            </div>

            {hoveredVideo && !selectedVideo && (
                <>
                    <div style={{ position: 'fixed', bottom: '30px', left: '30px', color: 'white', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100 }}>
                        {parseVideoTitle(hoveredVideo.title).fullArtist}
                    </div>
                    <div style={{ position: 'fixed', bottom: '30px', right: '30px', color: 'white', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100 }}>
                        {parseVideoTitle(hoveredVideo.title).songTitle}
                    </div>
                </>
            )}

            {lastVideo && !hoveredVideo && !selectedVideo && (
                <div
                    onClick={() => setSelectedVideo(lastVideo)}
                    style={{
                        position: 'fixed', bottom: '30px', right: '30px', color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100, cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#fff'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                >REPLAY LAST VIDEO</div>
            )}

            {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => { setLastVideo(selectedVideo); setSelectedVideo(null); }} backdropColor="transparent" />
            )}
        </div>
    );
};

export default PreviousHomePage;
