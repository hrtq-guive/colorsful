import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, getWeightedHslDistance } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// Pre-process videos (Same as Palette)
const processedVideos = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    return {
        ...v,
        id: i,
        rgb,
        hsl: rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 }
    };
}).filter(v => v.rgb);

const Blind = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const creditTimeoutRef = useRef(null);
    const wheelRef = useRef(null);
    const requestRef = useRef(null);

    // Use RAF for smooth visual updates (mask)
    const updateVisuals = (e, rect) => {
        if (!wheelRef.current) return;
        wheelRef.current.style.setProperty('--local-x', `${e.clientX - rect.left}px`);
        wheelRef.current.style.setProperty('--local-y', `${e.clientY - rect.top}px`);
    };

    const handleMouseMove = (e) => {
        if (!wheelRef.current) return;
        if (showCredit) setShowCredit(false);
        const rect = wheelRef.current.getBoundingClientRect();

        // Update visuals immediately via RAF
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => updateVisuals(e, rect));

        // Color matching logic
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const dx = localX - centerX;
        const dy = localY - centerY;
        const r = Math.sqrt(dx * dx + dy * dy);
        const maxR = Math.min(centerX, centerY);
        if (r > maxR) return;

        const rNorm = r / maxR;
        const angle = Math.atan2(dy, dx);
        // Add 90deg offset because conic-gradient starts at 12 o'clock, atan2 at 3 o'clock
        const h = ((angle * 180 / Math.PI) + 90 + 360) % 360;

        // Use radius (rNorm) to explore different "depths" of the color space
        // Center (0) is more pastel/desaturated
        // Edge (1) is full vibrant COLORS aesthetic
        const s = 40 + (60 * rNorm);
        const l = 40 + (20 * rNorm); // Subtle lightness sweep from 40% to 60%

        const targetHsl = { h, s, l };
        let closest = null;
        let minDist = Infinity;

        for (const video of processedVideos) {
            // Use perception-based HSL distance for high sensitivity
            const dist = getWeightedHslDistance(targetHsl, video.hsl);
            if (dist < minDist) {
                minDist = dist;
                closest = video;
            }
        }

        setHoveredVideo(prev => {
            if (closest && (!prev || closest.id !== prev.id)) {
                return closest;
            }
            return prev;
        });
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
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            overflow: 'hidden'
        }}>
            {/* COLORSFUL - Top Left */}
            <div
                onMouseEnter={() => {
                    setIsBrandingHovered(true);
                    setShowCredit(true);
                    if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current);
                    creditTimeoutRef.current = setTimeout(() => {
                        setShowCredit(false);
                    }, 3000);
                }}
                onMouseLeave={() => setIsBrandingHovered(false)}
                onClick={() => {
                    setShowCredit(true);
                    if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current);
                    creditTimeoutRef.current = setTimeout(() => {
                        setShowCredit(false);
                    }, 3000);
                }}
                style={{
                    position: 'fixed',
                    top: '30px',
                    left: '30px',
                    color: isBrandingHovered ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '2rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    zIndex: 100,
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
            >
                COLORSFUL
            </div>

            {/* Credit Text */}
            <div style={{
                position: 'fixed',
                top: '75px',
                left: '30px',
                zIndex: 100,
                opacity: (showCredit && !selectedVideo) ? 1 : 0,
                pointerEvents: showCredit ? 'auto' : 'none',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                transform: showCredit ? 'translateY(0)' : 'translateY(-10px)'
            }}>
                <a
                    href="https://www.heretique.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        opacity: 0.7,
                        textTransform: 'none',
                        letterSpacing: '0'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                    created by hérétique
                </a>
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
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
                    position: 'relative',
                    cursor: 'pointer',
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s',
                    '--local-x': '50%',
                    '--local-y': '50%'
                }}
            >
            </div>

            {/* Artist Name - Bottom Left (only when hovering) */}
            {hoveredVideo && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '30px',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    zIndex: 100,
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s'
                }}>
                    {parseVideoTitle(hoveredVideo.title).fullArtist}
                </div>
            )}

            {/* Song Title - Bottom Right (only when hovering) */}
            {hoveredVideo && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    zIndex: 100,
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s'
                }}>
                    {parseVideoTitle(hoveredVideo.title).songTitle}
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

export default Blind;
