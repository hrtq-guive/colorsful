import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseVideoTitle } from '../utils/titleParser';
import { useFavorites } from '../contexts/FavoritesContext';

const VideoModal = ({ video, onClose, backdropColor = 'rgba(0,0,0,0.95)' }) => {
    if (!video) return null;

    const navigate = useNavigate();
    const [showControls, setShowControls] = useState(false);
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const hideTimeoutRef = useRef(null);
    const creditTimeoutRef = useRef(null);
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const progressIntervalRef = useRef(null);

    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(video.url);

    // Extract video ID from URL
    const videoId = video.url.split('v=')[1]?.split('&')[0];

    const { fullArtist, songTitle } = parseVideoTitle(video.title);

    const handleVideoClick = (e) => {
        e.stopPropagation();
        // Navigate to video color URL before opening external link
        navigate(`/${video.color.replace('#', '')}`);
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

    const handleProgressClick = (e) => {
        if (!playerRef.current || !duration) return;
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const seekTime = percentage * duration;

        playerRef.current.seekTo(seekTime, true);
    };

    const togglePlayPause = (e) => {
        e.stopPropagation();
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
            setIsPlaying(false);
        } else {
            playerRef.current.playVideo();
            setIsPlaying(true);
        }
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
                    onReady: (event) => {
                        event.target.playVideo();
                        setDuration(event.target.getDuration());

                        // Start progress tracking
                        progressIntervalRef.current = setInterval(() => {
                            if (playerRef.current && playerRef.current.getCurrentTime) {
                                const current = playerRef.current.getCurrentTime();
                                const total = playerRef.current.getDuration();
                                setProgress((current / total) * 100);
                            }
                        }, 100);
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onClose();
                        } else if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                        } else if (event.data === window.YT.PlayerState.PAUSED) {
                            setIsPlaying(false);
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
            // Ensure cursor is shown when modal closes/unmounts
            window.dispatchEvent(new Event('cursor-show'));

            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            if (creditTimeoutRef.current) clearTimeout(creditTimeoutRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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
                alignItems: 'center',
                flexDirection: 'column'
            }}
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
                    e.stopPropagation();
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
                data-cursor="small"
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
                    data-cursor="small"
                >
                    created by hérétique
                </a>
            </div>

            {/* Video Container with Progress Bar and Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    style={{
                        width: '80vw',
                        maxWidth: '800px',
                        aspectRatio: '16/9',
                        position: 'relative',
                        background: '#000',
                        cursor: 'none' // Hide default cursor, wait for iframe to handle it
                    }}
                    onClick={handleVideoClick}
                    className="video-iframe-wrapper"
                >
                    <div
                        ref={containerRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'block'
                        }}
                    />
                    {/* Interaction Overlay: Captures mouse to keep custom cursor visible and catches clicks */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                        cursor: 'none'
                    }} />
                </div>

                {/* Progress Bar - Outside Video */}
                <div
                    onClick={handleProgressClick}
                    data-cursor="small"
                    style={{
                        width: '80vw',
                        maxWidth: '800px',
                        height: '3px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        marginTop: '8px',
                        cursor: 'pointer',
                        position: 'relative',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: 'white',
                        transition: 'width 0.1s linear'
                    }} />
                </div>

                {/* Controls Row under Progress Bar */}
                <div style={{
                    width: '80vw',
                    maxWidth: '800px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    opacity: showControls ? 1 : 0,
                    transition: 'opacity 0.3s'
                }}>
                    {/* Play/Pause Button - Left */}
                    <div
                        onClick={togglePlayPause}
                        data-cursor="small"
                        style={{
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15rem',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        {isPlaying ? "PAUSE" : "PLAY"}
                    </div>

                    {/* Add to Palette - Right */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(video);
                        }}
                        data-cursor="small"
                        style={{
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15rem',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        {isFav ? "ON PALETTE" : "ADD TO PALETTE"}
                    </div>
                </div>
            </div>

            {/* Artist - Bottom Left */}
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

            {/* Song Title - Bottom Right */}
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
