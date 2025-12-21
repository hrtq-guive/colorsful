import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, getDistance, rgbToHsl } from '../utils/color';
import VideoModal from './VideoModal';

// Pre-process videos
const processedVideos = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    return {
        ...v,
        id: i, // Generate stable ID
        rgb,
        hsl: rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 }
    };
}).filter(v => v.rgb);

const Palette = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const wheelRef = useRef(null);
    const requestRef = useRef(null);
    const [debugInfo, setDebugInfo] = useState({ target: null, dist: null }); // Visual Debug

    // Use RAF for smooth visual updates (mask)
    const updateVisuals = (e, rect) => {
        if (!wheelRef.current) return;
        wheelRef.current.style.setProperty('--local-x', `${e.clientX - rect.left}px`);
        wheelRef.current.style.setProperty('--local-y', `${e.clientY - rect.top}px`);
    };

    // Debug data load
    useEffect(() => {
        console.log("Palette Mounted. Videos:", processedVideos.length);
    }, []);

    const handleMouseMove = (e) => {
        if (!wheelRef.current) return;

        const rect = wheelRef.current.getBoundingClientRect();

        // 1. Immediate Visual Update (Mask)
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => updateVisuals(e, rect));

        // 2. Color Logic - No manual throttle for Debugging
        // const now = Date.now();
        // if (now - lastColorUpdate.current < 50) return; 
        // lastColorUpdate.current = now;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;
        const radius = Math.sqrt(x * x + y * y);
        const maxRadius = rect.width / 2;

        let angleRad = Math.atan2(y, x);
        // Normalize 0 to 360 where -PI/2 (top) is 0?
        // atan2: 0 is Right. 
        // We want 0 at Top.
        // angleDeg = angleRad * 180 / PI
        let angleDeg = angleRad * (180 / Math.PI);
        // 0(Right) -> 90(Bottom) -> 180(Left) -> -90(Top)
        // We want Top=0.
        // So Top (-90) -> +90 = 0.
        // Right (0) -> +90 = 90.
        let cssAngle = angleDeg + 90;
        if (cssAngle < 0) cssAngle += 360;

        let rNorm = Math.min(radius / maxRadius, 1);

        const h = cssAngle; // Restore missing definition

        // Logic: Keep colors more saturated/visible even in center.
        // User said "center is too bright, we can't see the color".
        // Previous: L goes from 100 (center) to 50 (edge). L=100 is pure white.
        // New: L goes from 70 (center) to 50 (edge). Still "lit" but colored.
        // Logic: Keep colors more saturated/visible even in center.
        // User said "center is too bright, we can't see the color".
        // Improved: L goes from 80 (center) to 40 (edge) to cover more ground.
        const l = 80 - (40 * rNorm);
        // Saturation 60-100
        const s = 60 + (40 * rNorm);

        const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
        const xVal = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = (l / 100) - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = xVal; b = 0; }
        else if (60 <= h && h < 120) { r = xVal; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = xVal; }
        else if (180 <= h && h < 240) { r = 0; g = xVal; b = c; }
        else if (240 <= h && h < 300) { r = xVal; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = xVal; }

        const targetRgb = {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };

        // Find closest match
        let minDist = Infinity;
        let closest = null;

        // Console log only once to avoid flooding (or check if length is 0)
        // console.log("Total videos:", processedVideos.length);

        for (const v of processedVideos) {
            const dist = getDistance(targetRgb, v.rgb);
            if (dist < minDist) {
                minDist = dist;
                closest = v;
            }
        }

        // Update info/state (Throttled?)
        // setDebugInfo({ target: targetRgb, dist: minDist });
        // NOTE: Updating state on every frame might be too heavy? 
        // Let's rely on hover id for now.
        // Actually, if hoveredVideo is null, we want to know why.
        // Let's use a simpler debug approach:

        // Debug logging - Uncommented for diagnosis
        if (Math.random() < 0.05) {
            console.log('HSL:', { h, s, l }, 'RGB:', targetRgb, 'Closest:', closest?.title, 'Dist:', minDist);
        }

        // Update state
        setHoveredVideo(prev => {
            if (closest && (!prev || closest.id !== prev.id)) {
                return closest;
            }
            return prev;
        });
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                background: '#0a0a0a', // Very dark grey/black
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
        >
            {/* COLORSFUL - Top Left */}
            <div style={{
                position: 'fixed',
                top: '30px',
                left: '30px',
                color: 'white',
                fontSize: '2rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                zIndex: 100,
                opacity: 1,
                mixBlendMode: 'difference'
            }}>
                COLORSFUL
            </div>

            {/* LEFT SIDE: Color Wheel - Fixed Width to prevent shifting */}
            <div
                style={{
                    width: '50vw', // Fixed 50% width
                    flex: '0 0 50vw', // Don't grow/shrink
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    height: '100%',
                    background: hoveredVideo ? hoveredVideo.color : 'black', // Dynamic background
                    transition: 'background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
            >
                <div
                    ref={wheelRef}
                    onMouseMove={handleMouseMove}
                    onClick={() => hoveredVideo && setSelectedVideo(hoveredVideo)}
                    style={{
                        width: '30vmax', // Smaller wheel (was 40vmax)
                        height: '30vmax',
                        borderRadius: '50%',
                        position: 'relative',
                        cursor: 'none'
                    }}
                >
                    {/* Base Wheel - Lighter (per request "wheel colors are very dark") */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
                        // "dark" issue: grayscale(80%) makes it almost black. 
                        // Try less grayscale, more brightness? 
                        // Or just opacity.
                        filter: 'grayscale(50%) opacity(0.5)',
                        zIndex: 1
                    }} />

                    {/* Vibrant Masked Wheel */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
                        zIndex: 2,
                        maskImage: 'radial-gradient(circle 100px at var(--local-x, 50%) var(--local-y, 50%), black 0%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(circle 100px at var(--local-x, 50%) var(--local-y, 50%), black 0%, transparent 100%)',
                    }} />

                    {/* Cursor Dot */}
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0,
                        transform: 'translate(calc(var(--local-x) - 50%), calc(var(--local-y) - 50%))',
                        width: '12px', height: '12px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.8)', // Less luminous
                        boxShadow: '0 0 5px rgba(255,255,255, 0.5)', // Less glow
                        pointerEvents: 'none',
                        zIndex: 20,
                        mixBlendMode: 'overlay' // Blend with color
                    }} />
                </div>
            </div>

            {/* RIGHT SIDE: Video Thumbnail - Fixed Width */}
            <div
                style={{
                    width: '50vw',
                    flex: '0 0 50vw',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center', // Center content horizontally
                    padding: '60px',
                    boxSizing: 'border-box',
                    // Minimalist transition
                    // User: "put the wheel on the left and the video thumbnail on the right"
                    // "sleek, clean, minimalistic"
                    // Let's use the video color as a subtle background tint or just black?
                    // "Colors aesthetic" = solid background color.
                    height: '100vh', // Ensure full height
                    background: hoveredVideo ? hoveredVideo.color : '#111',
                    transition: 'background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
            >
                {hoveredVideo ? (
                    <div style={{
                        width: '100%',
                        maxWidth: '450px', // Smaller image as requested
                        textAlign: 'left', // COLORS usually aligns left or center-bold
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        // Stabilize layout:
                        // Removed fixed height to allow proper centering
                        // Added minimum height to stability
                        justifyContent: 'center'
                    }}>
                        {/* Video Thumbnail - Fixed Height Container */}
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            // No shadow for seamless blending
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0 // Don't shrink
                        }}
                            onClick={() => setSelectedVideo(hoveredVideo)}
                        >
                            <img
                                src={hoveredVideo.thumbnail}
                                alt={hoveredVideo.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Text Info - Fixed Height Area */}
                        <div style={{
                            flexGrow: 1, // Take remaining space
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start', // Align top of text area
                            minHeight: '120px' // Reserve space for text to prevent jumps
                        }}>
                            <h1 style={{
                                textTransform: 'uppercase',
                                fontSize: '2rem',
                                fontWeight: '800',
                                margin: '0 0 10px 0',
                                lineHeight: '1',
                                letterSpacing: '-1px', // Tight modern bold spacing
                                // Clamping text lines if needed, but flex-start handles variable height
                            }}>
                                {hoveredVideo.title.split('|')[0].trim()}
                            </h1>
                            <p style={{
                                fontSize: '0.9rem',
                                opacity: 0.9,
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                letterSpacing: '2px', // Wide spacing for subtitles
                                margin: 0
                            }}>
                                {hoveredVideo.title.split('|')[1]?.trim() || 'A COLORS SHOW'}
                            </p>

                            {/* Metadata / Hex Code */}
                            <div style={{
                                marginTop: '15px',
                                fontSize: '0.8rem',
                                opacity: 0.6,
                                fontFamily: 'monospace'
                            }}>
                                {hoveredVideo.color.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

            {/* <div style={{
                position: 'fixed', top: 0, left: 0, 
                background: 'rgba(255,0,0,0.8)', color: 'white', 
                padding: '10px', fontSize: '12px', pointerEvents: 'none', zIndex: 9999,
                maxWidth: '300px'
            }}>
                <strong>DEBUG</strong><br/>
                Videos: {processedVideos.length}<br/>
                Hover ID: {hoveredVideo ? hoveredVideo.id : 'null'}<br/>
            </div> */}
        </div>
    );
};

export default Palette;
