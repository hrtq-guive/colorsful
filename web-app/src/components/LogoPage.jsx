import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseVideoTitle } from '../utils/titleParser';
import { useVideo } from '../contexts/VideoContext';
import { processedVideos, nebulaIslands, getLogoMaxRadiusAtAngle } from '../utils/nebulaConfig';

const LogoPage = ({ hoveredVideo: globalHoveredVideo, setHoveredVideo: setGlobalHoveredVideo }) => {
    const { color } = useParams();
    const navigate = useNavigate();
    const { currentVideo, openVideo } = useVideo();
    const [lastVideo, setLastVideo] = useState(null);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const [isInsideLogo, setIsInsideLogo] = useState(false);
    const creditTimeoutRef = useRef(null);
    const wheelRef = useRef(null);
    const voronoiCanvasRef = useRef(null);

    // Use global state if provided, otherwise fallback (though App should provide it)
    const hoveredVideo = globalHoveredVideo;
    const setHoveredVideo = setGlobalHoveredVideo || (() => { });

    const handleVideoClose = () => {
        setLastVideo(currentVideo);
        navigate('/');
    };

    useEffect(() => {
        if (color) {
            const video = processedVideos.find(v => v.color.replace('#', '').toLowerCase() === color.toLowerCase());
            if (video) {
                if (!currentVideo || currentVideo.url !== video.url) {
                    openVideo(video, { onClose: handleVideoClose, backdropColor: 'transparent' });
                }
            }
        }
    }, [color]);

    const handleVideoSelect = (video) => {
        if (video) {
            openVideo(video, { onClose: handleVideoClose, backdropColor: 'transparent' });
            navigate(`/${video.color.replace('#', '')}`);
        }
    };

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
            background: currentVideo ? currentVideo.color : (hoveredVideo ? hoveredVideo.color : '#0a0a0a'),
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
                    letterSpacing: '0.3rem', zIndex: 100, opacity: currentVideo ? 0 : 1, transition: 'all 0.3s ease', cursor: 'pointer'
                }}
            >COLORSFUL</div>

            <div style={{ position: 'fixed', top: '58px', left: '30px', zIndex: 100, opacity: (showCredit && !currentVideo) ? 1 : 0, pointerEvents: showCredit ? 'auto' : 'none', transition: 'opacity 0.4s ease', transform: showCredit ? 'translateY(0)' : 'translateY(-10px)' }}>
                <a href="https://www.heretique.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '0.6rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2rem' }}>created by hérétique</a>
            </div>

            <div
                ref={wheelRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => hoveredVideo && handleVideoSelect(hoveredVideo)}
                style={{
                    width: '42vmax', height: '42vmax',
                    maskImage: 'url(/logo-mask.svg)', WebkitMaskImage: 'url(/logo-mask.svg)',
                    maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center', WebkitMaskPosition: 'center', position: 'relative', cursor: 'none',
                    opacity: currentVideo ? 0 : 1, transition: 'opacity 0.4s'
                }}
                {...(isInsideLogo && { 'data-cursor': 'small' })}
            >
                <canvas ref={voronoiCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            </div>

            {hoveredVideo && !currentVideo && (
                <>
                    <div style={{ position: 'fixed', bottom: '30px', left: '30px', color: 'white', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100 }}>
                        {parseVideoTitle(hoveredVideo.title).fullArtist}
                    </div>
                    <div style={{ position: 'fixed', bottom: '30px', right: '30px', color: 'white', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100 }}>
                        {parseVideoTitle(hoveredVideo.title).songTitle}
                    </div>
                </>
            )}

            {lastVideo && !hoveredVideo && !currentVideo && (
                <div
                    onClick={() => handleVideoSelect(lastVideo)}
                    style={{
                        position: 'fixed', bottom: '30px', right: '30px', color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3rem', zIndex: 100, cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#fff'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                >REPLAY LAST VIDEO</div>
            )}
        </div>
    );
};

export default LogoPage;
