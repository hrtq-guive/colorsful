import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseVideoTitle } from '../utils/titleParser';
import { useVideo } from '../contexts/VideoContext';
import { processedVideos, nebulaIslands, getLogoMaxRadiusAtAngle } from '../utils/nebulaConfig';
import { useFavorites } from '../contexts/FavoritesContext';

const Palette = ({ videos, onClose, setShowPalette, showFullPalette, hoveredVideo, setHoveredVideo }) => {
    const { favorites } = useFavorites();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const wheelRef = useRef(null);
    const voronoiCanvasRef = useRef(null);
    const { currentVideo, openVideo } = useVideo();
    const [lines, setLines] = useState([]);
    // Hover state lifted to App.jsx
    const [persistentSearchLines, setPersistentSearchLines] = useState([]);

    // Stable ID generator for videos
    const getVideoId = (v) => v.url.split('v=')[1]?.split('&')[0] || v.url;

    // Default videos if none provided: Use favorites or a sample
    const displayVideos = useMemo(() => {
        let baseVideos = [];
        if (videos) {
            baseVideos = videos;
        } else if (showFullPalette) {
            const favs = processedVideos.filter(pv =>
                favorites.some(fav => fav.url === pv.url)
            );
            baseVideos = favs;
        }

        // Ensure all videos have full layout data and are sorted by vertical position
        return baseVideos.map(v => {
            const pv = processedVideos.find(p => p.url === v.url) || v;
            return pv;
        }).sort((a, b) => a.wheelY - b.wheelY); // Ascending
    }, [videos, favorites, showFullPalette]);

    const isFullPalette = showFullPalette || !!videos;

    // Nebula Rendering
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
    }, []);

    // Line Update Logic
    useEffect(() => {
        if (!containerRef.current) return;
        let animationFrameId;
        const updateLineEndpoints = () => {
            const containerRect = containerRef.current.getBoundingClientRect();
            setLines(prevLines => {
                let changed = false;
                const newLines = prevLines.map(line => {
                    const circleId = `label-circle-${getVideoId(line.video)}`; // Robust ID
                    const circleEl = document.getElementById(circleId);
                    if (circleEl) {
                        const circleRect = circleEl.getBoundingClientRect();
                        const newEndX = circleRect.left - containerRect.left + circleRect.width / 2;
                        const newEndY = circleRect.top - containerRect.top + circleRect.height / 2;
                        if (Math.abs(line.endX - newEndX) > 0.1 || Math.abs(line.endY - newEndY) > 0.1) {
                            changed = true;
                            return { ...line, endX: newEndX, endY: newEndY };
                        }
                    }
                    return line;
                });
                return changed ? newLines : prevLines;
            });
            animationFrameId = requestAnimationFrame(updateLineEndpoints);
        };
        animationFrameId = requestAnimationFrame(updateLineEndpoints);
        return () => cancelAnimationFrame(animationFrameId);
    }, [displayVideos, isFullPalette]);

    // Layout Logic - REMOVED (No longer needed for list view)

    // Persistent Search Lines Logic - REMOVED

    const handleMouseMove = (e) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        const dx = mouseX - 50, dy = mouseY - 50;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

        if (dist > getLogoMaxRadiusAtAngle(angle) + 2) {
            setHoveredVideo(null);
            return;
        }

        let closest = null, minDist = Infinity;
        displayVideos.forEach(v => {
            const d = Math.sqrt(Math.pow(mouseX - v.wheelX, 2) + Math.pow(mouseY - v.wheelY, 2));
            if (d < minDist) { minDist = d; closest = v; }
        });

        if (minDist < 15) {
            setHoveredVideo(closest);
        } else {
            setHoveredVideo(null);
        }
    };

    const handleVideoSelect = (video) => {
        openVideo(video, { backdropColor: 'transparent' });
        navigate(`/${video.color.replace('#', '')}`);
        if (onClose) onClose();
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1600,
                backgroundColor: hoveredVideo ? 'transparent' : 'black',
                overflow: 'hidden',
                transition: 'background-color 0.4s ease'
            }}
        >
            {/* Backdrop for fade - Hide when hovering to show pure color */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 1,
                opacity: hoveredVideo ? 0 : 1,
                transition: 'opacity 0.4s ease'
            }} />

            {/* Nebula Background */}
            <div
                ref={wheelRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (hoveredVideo) handleVideoSelect(hoveredVideo);
                }}
                style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '42vmax', height: '42vmax',
                    maskImage: 'url(/logo-mask.svg)', WebkitMaskImage: 'url(/logo-mask.svg)',
                    maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center', WebkitMaskPosition: 'center',
                    cursor: 'none',
                    opacity: currentVideo ? 0 : 1, transition: 'opacity 0.4s',
                    zIndex: 2
                }}
                {...(hoveredVideo && { 'data-cursor': 'small' })}
            >
                <canvas ref={voronoiCanvasRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Simple List View - Replaces Spatial Labels */}
        </div>
    );
};

export default Palette;
