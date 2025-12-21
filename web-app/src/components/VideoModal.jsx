import React, { useState, useRef, useEffect } from 'react';
import { parseVideoTitle } from '../utils/titleParser';

const VideoModal = ({ video, onClose, backdropColor = 'rgba(0,0,0,0.95)' }) => {
    if (!video) return null;

    const [showControls, setShowControls] = useState(false);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const hideTimeoutRef = useRef(null);
    const creditTimeoutRef = useRef(null);
    const playerRef = useRef(null);
    const containerRef = useRef(null);

    // Extract video ID from URL
    const videoId = video.url.split('v=')[1]?.split('&')[0];

    const { artist, songTitle, fullArtist } = parseVideoTitle(video.title);

    const handleVideoClick = (e) => {
        e.stopPropagation();
        window.open(video.url, '_blank');
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const handleMouseLeave = () => {
        setShowControls(false);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };

    useEffect(() => {
        // Load YouTube API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        const createPlayer = () => {
            playerRef.current = new window.YT.Player(containerRef.current, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    iv_load_policy: 3,
                    cc_load_policy: 0,
                    fs: 0,
                    disablekb: 1
                },
                events: {
                    onStateChange: (event) => {
                        // YT.PlayerState.ENDED is 0
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onClose();
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current);
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [videoId, onClose]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: backdropColor,
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            onClick={onClose}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
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
                onClick={(e) => {
                    e.stopPropagation(); // Don't close modal
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
                    zIndex: 1002,
                    opacity: showControls ? 1 : 0,
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
                zIndex: 1002,
                opacity: (showCredit && showControls) ? 1 : 0,
                pointerEvents: showCredit ? 'auto' : 'none',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                transform: showCredit ? 'translateY(0)' : 'translateY(-10px)'
            }}>
                <a
                    href="https://www.heretique.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
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
                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                >
                    created by hérétique
                </a>
            </div>

            {/* Close Button - Top Right of page */}
            <button
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: '30px',
                    right: '30px',
                    color: 'white',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    letterSpacing: '0.3rem',
                    cursor: 'pointer',
                    zIndex: 1002,
                    lineHeight: '1',
                    opacity: showControls ? 1 : 0,
                    transition: 'opacity 0.3s',
                    pointerEvents: showControls ? 'auto' : 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase'
                }}
            >
                X
            </button>

            {/* Video Container - 80% width, clickable */}
            <div
                style={{
                    width: '80vw',
                    maxWidth: '800px',
                    aspectRatio: '16/9',
                    position: 'relative',
                    background: '#000',
                    cursor: 'pointer'
                }}
                onClick={handleVideoClick}
            >
                {/* Video Player Container for YouTube API */}
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        pointerEvents: 'none'
                    }}
                />
            </div>

            {/* Artist - Bottom Left of page */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                left: '30px',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3rem',
                zIndex: 1001,
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.3s'
            }}>
                {fullArtist}
            </div>

            {/* Song Title - Bottom Right of page */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3rem',
                zIndex: 1001,
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.3s'
            }}>
                {songTitle}
            </div>
        </div>
    );
};

export default VideoModal;
