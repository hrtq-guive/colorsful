import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { processedVideos } from '../utils/nebulaConfig';
import { parseVideoTitle } from '../utils/titleParser';
import Navigation from './Navigation';
import { ASSET_BASE_URL } from '../config/assets';
import { useVideo } from '../contexts/VideoContext';

// Helper throttle
const simpleThrottle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 1. EXPANDED UNIVERSE: 12000px width.
// This spreads items out significantly to prevent overlap when zoomed in.
const CONTAINER_SIZE = 12000;
const VIDEO_SIZE = 300; // Bigger native size for quality, but relative to container it's smaller (300/12000 = 2.5% vs 160/4000 = 4%)

const LogoGrid = () => {
    const { openVideo } = useVideo();

    // Initial Zoom matches the new Container Size to fit screen
    // 12000px * 0.08 = 960px (approx screen height).
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.08 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });

    // STATE: Only render these videos!
    const [visibleItems, setVisibleItems] = useState([]);

    // LOD Settings
    const REVEAL_THRESHOLD = 0.2; // Adjusted for new scale

    const calculateVisibleVideos = useCallback(() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const containerCenterX = CONTAINER_SIZE / 2;
        const containerCenterY = CONTAINER_SIZE / 2;

        // Screen Center (Pan is applied here)
        const screenCenterX = viewportWidth / 2 + transform.x;
        const screenCenterY = viewportHeight / 2 + transform.y;

        // Optimized Filter: Only return items inside the viewport
        // This is the "Hard Culling" -> DOM elements won't exist if not here.
        const visible = processedVideos.filter(video => {
            const localX = (video.wheelX / 100) * CONTAINER_SIZE;
            const localY = (video.wheelY / 100) * CONTAINER_SIZE;

            const screenX = (localX - containerCenterX) * transform.scale + screenCenterX;
            const screenY = (localY - containerCenterY) * transform.scale + screenCenterY;

            // Margin of 200px to avoid pop-in
            return screenX > -300 && screenX < viewportWidth + 300 &&
                screenY > -300 && screenY < viewportHeight + 300;
        });

        // Add "isActive" flag for GIF vs JPG
        // Limit GIFs to first 40 to ensure perf
        const withState = visible.map((v, index) => ({
            ...v,
            showGif: index < 40
        }));

        setVisibleItems(withState);

    }, [transform.x, transform.y, transform.scale]);

    // Throttle calculation (100ms - faster responsiveness)
    useEffect(() => {
        const handler = simpleThrottle(() => {
            calculateVisibleVideos();
        }, 100);
        handler();
    }, [transform, calculateVisibleVideos]);

    const handleWheel = (e) => {
        const ZOOM_SPEED = 0.0005; // Slower zoom for massive scale
        // Zoom relative to scale to feel consistent
        const delta = -e.deltaY * ZOOM_SPEED * transform.scale * 5;
        const newScale = Math.max(0.01, Math.min(2, transform.scale + delta));

        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };

        setTransform(prev => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy
        }));
    };

    const handleMouseUp = () => { setIsDragging(false); };

    // LOD Animation Values
    // Start revealing earlier
    const contentAppearProgress = Math.max(0, transform.scale - REVEAL_THRESHOLD) / 0.1;
    const contentOpacity = Math.min(1, contentAppearProgress);

    // Scale Logic:
    // Starts at 0.5 when revealed. Grows to 1.0 slowly.
    const contentScale = Math.min(1, 0.5 + (Math.max(0, transform.scale - REVEAL_THRESHOLD) * 1.5));

    const showContent = contentOpacity > 0;
    const dotOpacity = 1 - contentOpacity;

    return (
        <div
            style={{
                width: '100vw', height: '100vh',
                overflow: 'hidden', background: '#0a0a0a',
                cursor: isDragging ? 'grabbing' : 'grab', position: 'relative'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <Navigation />

            <div style={{
                position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-primary)',
                textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px',
                pointerEvents: 'none', opacity: showContent ? 0 : 1, transition: 'opacity 0.5s'
            }}>Scroll to Explore</div>

            {/* Container */}
            <div
                style={{
                    width: CONTAINER_SIZE, height: CONTAINER_SIZE,
                    position: 'absolute', top: '50%', left: '50%',
                    transform: `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    // Dragging = instant, Zoom = smoothed slightly? 
                    // Actually for "rame pas", instant is often better or very fast transition.
                    transition: isDragging ? 'none' : 'transform 0.1s linear'
                }}
            >
                {/* Render ONLY visible items */}
                {visibleItems.map(video => {
                    const x = (video.wheelX / 100) * CONTAINER_SIZE;
                    const y = (video.wheelY / 100) * CONTAINER_SIZE;
                    const videoId = video.url.split('v=')[1]?.split('&')[0];
                    const jpgPath = `${ASSET_BASE_URL}captures/${videoId}_45s.jpg`;
                    const gifPath = `${ASSET_BASE_URL}captures/${videoId}_45s.gif`;
                    const { fullArtist } = parseVideoTitle(video.title);

                    const currentSrc = (video.showGif && showContent) ? gifPath : jpgPath;

                    return (
                        <div
                            key={video.id}
                            style={{
                                position: 'absolute',
                                left: x - VIDEO_SIZE / 2,
                                top: y - VIDEO_SIZE / 2,
                                width: VIDEO_SIZE,
                                height: VIDEO_SIZE * (9 / 16),
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                willChange: 'transform, opacity' // Hardware accelerate items
                            }}
                            onClick={(e) => {
                                if (showContent) {
                                    e.stopPropagation();
                                    openVideo(video, { backdropColor: 'transparent' });
                                }
                            }}
                        >
                            {/* Dot */}
                            {dotOpacity > 0.05 && (
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%', // Bigger dot for bigger canvas
                                    backgroundColor: video.color, position: 'absolute',
                                    opacity: dotOpacity,
                                    boxShadow: `0 0 30px ${video.color}`,
                                    zIndex: 1
                                }} />
                            )}

                            {/* Image/GIF */}
                            {showContent && (
                                <div style={{
                                    width: '100%', height: '100%',
                                    opacity: contentOpacity,
                                    transform: `scale(${contentScale})`,
                                    zIndex: 2,
                                    pointerEvents: 'auto',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backgroundColor: '#000' // Avoid transparent flashes
                                }}>
                                    <img
                                        src={currentSrc}
                                        alt={fullArtist}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            if (e.target.src !== `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`) {
                                                e.target.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Debug Info (Optional - helpful for performance tuning) */}
            {/* <div style={{position:'fixed', top:0, left:0, color:'lime'}}>
                Visible: {visibleItems.length} | Zoom: {transform.scale.toFixed(4)}
            </div> */}
        </div>
    );
};

export default LogoGrid;
