import React, { useState, useEffect, useRef } from 'react';
import videosData from '../data/videos.json';
import { hexToRgb, rgbToHsl } from '../utils/color';
import { parseVideoTitle } from '../utils/titleParser';
import VideoModal from './VideoModal';

// Pre-process videos
const processedVideos = videosData.map((v, i) => {
    const rgb = hexToRgb(v.color);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };

    // Position calculation
    // Angle based on Hue (0-360)
    const angleRad = (hsl.h - 90) * (Math.PI / 180); // -90 to start red at top

    // Vibrancy (Chroma-like) mapping: Pure colors on edge, neutrals/dark/light in center
    // Formula: S * (1 - |L-50|/50)
    const vibrancy = hsl.s * (1 - Math.abs(hsl.l - 50) / 50);

    // Scale radius: 0-100 vibrancy mapped to 5% to 42% of container
    const baseRadius = 5 + (vibrancy * 0.37);

    // Use a stable jitter based on the video index to avoid shifting on reload
    const stableJitter = ((i * 137.5) % 3) - 1.5; // +/- 1.5%
    const radius = baseRadius + stableJitter;

    return {
        ...v,
        id: i,
        hsl,
        x: 50 + radius * Math.cos(angleRad),
        y: 50 + radius * Math.sin(angleRad),
    };
}).filter(v => v.color);

const Point = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [backgroundVideo, setBackgroundVideo] = useState(null);
    const resetTimeoutRef = useRef(null);
    const containerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Find closest video within threshold
        // Cursor size is 15px, so radius is 7.5px. 
        // User wants "size of round cursor", let's use 15px radius as a generous threshold
        // ensuring high responsiveness.
        const threshold = 15;

        let closest = null;
        let minDist = threshold;

        // Optimization: only check dots if within the cloud container bounds approximately
        processedVideos.forEach((video) => {
            const dotX = rect.left + (video.x / 100) * rect.width;
            const dotY = rect.top + (video.y / 100) * rect.height;
            const dist = Math.sqrt(Math.pow(mouseX - dotX, 2) + Math.pow(mouseY - dotY, 2));

            if (dist < minDist) {
                minDist = dist;
                closest = video;
            }
        });

        if (closest) {
            setHoveredVideo(closest);
            setBackgroundVideo(closest);
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
                resetTimeoutRef.current = null;
            }
        } else {
            setHoveredVideo(null);
            // Don't clear background immediately, wait 1s
            if (!resetTimeoutRef.current && backgroundVideo) {
                resetTimeoutRef.current = setTimeout(() => {
                    setBackgroundVideo(null);
                    resetTimeoutRef.current = null;
                }, 1000);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{
                width: '100vw',
                height: '100vh',
                background: selectedVideo ? selectedVideo.color : (backgroundVideo ? backgroundVideo.color : '#000'),
                transition: 'background-color 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: "'Inter', sans-serif",
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Branding - hidden when video is playing for cleaner look, similar to Blind */}
            <div style={{
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
            }}>
                COLORSFUL
            </div>

            {/* Point Cloud Container */}
            <div
                ref={containerRef}
                style={{
                    width: '80vmin',
                    height: '80vmin',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: selectedVideo ? 0 : 1,
                    transition: 'opacity 0.4s'
                }}
            >
                {processedVideos.map((video) => (
                    <div
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        style={{
                            position: 'absolute',
                            left: `${video.x}%`,
                            top: `${video.y}%`,
                            width: '4px', // Slightly smaller dots for cleaner cloud
                            height: '4px',
                            borderRadius: '50%',
                            background: video.color,
                            transform: 'translate(-50%, -50%)',
                            transition: 'all 0.3s ease',
                            boxShadow: hoveredVideo?.id === video.id ? `0 0 10px ${video.color}` : 'none',
                            opacity: hoveredVideo ? (hoveredVideo.id === video.id ? 1 : 0.3) : 0.6,
                            scale: hoveredVideo?.id === video.id ? 2 : 1,
                            zIndex: hoveredVideo?.id === video.id ? 10 : 1,
                            pointerEvents: 'none'
                        }}
                    />
                ))}

                <div
                    onClick={() => hoveredVideo && setSelectedVideo(hoveredVideo)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        cursor: 'none'
                    }}
                    data-cursor="small"
                />
            </div>

            {/* Artist/Song Info */}
            <div style={{
                position: 'fixed',
                bottom: '40px',
                width: '100%',
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

export default Point;
