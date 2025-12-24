import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl, getWeightedHslDistance } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// Pre-process videos with spatial coordinates
const processedVideos = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };

    // Position calculation for the wheel
    // Angle based on Hue (0-360)
    const angleRad = (hsl.h - 90) * (Math.PI / 180);

    // Vibrancy mapping: Pure colors on edge, neutrals/dark/light in center
    // Formula: S * (1 - |L-50|/50)
    const vibrancy = hsl.s * (1 - Math.abs(hsl.l - 50) / 50);

    const radius = vibrancy; // 0 (center) to 100 (edge)

    return {
        ...v,
        id: i,
        rgb,
        hsl,
        // Relative coordinates in the circle (0-100)
        wheelX: 50 + (radius / 2) * Math.cos(angleRad),
        wheelY: 50 + (radius / 2) * Math.sin(angleRad),
    };
}).filter(v => v.rgb);

const Blind = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [lastVideo, setLastVideo] = useState(null);
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

        // Spatial matching logic
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        // Ensure we are inside the circle
        const dx = mouseX - 50;
        const dy = mouseY - 50;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter > 50) {
            setHoveredVideo(null);
            return;
        }

        let closest = null;
        let minDist = Infinity;

        // Find the video whose pre-calculated "sweet spot" is closest to mouse
        for (const video of processedVideos) {
            const d = Math.sqrt(Math.pow(mouseX - video.wheelX, 2) + Math.pow(mouseY - video.wheelY, 2));
            if (d < minDist) {
                minDist = d;
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
            fontFamily: "'Inter', sans-serif",
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
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3rem',
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
                top: '58px',
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
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        opacity: 0.6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2rem'
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
                onClick={() => {
                    if (hoveredVideo) {
                        setSelectedVideo(hoveredVideo);
                        setLastVideo(hoveredVideo);
                    }
                }}
                style={{
                    width: '35vmax',
                    height: '35vmax',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
                    position: 'relative',
                    cursor: 'none',
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s',
                    '--local-x': '50%',
                    '--local-y': '50%'
                }}
                data-cursor="small"
            >
            </div>

            {/* Artist Name - Bottom Left (only when hovering) */}
            {hoveredVideo && (
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
            )}

            {/* Song Title - Bottom Right (only when hovering) */}
            {hoveredVideo && (
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
            )}

            {/* Replay Last Video - Bottom Right (only if a video was played before) */}
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

export default Blind;
