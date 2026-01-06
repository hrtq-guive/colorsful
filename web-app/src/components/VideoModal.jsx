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
    const [playbackReady, setPlaybackReady] = useState(false);
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
        // If in landscape touch mode, tap toggles controls instead of opening external link
        if (isTouch && isLandscape) {
            setShowControls(!showControls);
            return;
        }

        // Navigate to video color URL before opening external link
        const slug = (video.hexpickhome || video.color).replace('#', '');
        navigate(`/${slug}`);
        window.open(video.url, '_blank');
    };

    // Orientation state with robust detection
    const [isLandscape, setIsLandscape] = useState(false);
    // Detect touch device
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        const checkTouch = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsTouch(isTouchDevice);
        };
        checkTouch();
        window.addEventListener('touchstart', checkTouch, { once: true });

        const checkOrientation = () => {
            // Simplified: Visual layout depends purely on dimensions
            const isWide = window.innerWidth > window.innerHeight;
            setIsLandscape(isWide);
        };

        window.addEventListener('resize', checkOrientation);
        // We still listen to orientation change to trigger resize check sooner
        const mql = window.matchMedia("(orientation: landscape)");

        const handleMQL = () => {
            checkOrientation();
        };

        try { mql.addEventListener('change', handleMQL); }
        catch (e) { try { mql.addListener(handleMQL); } catch (e2) { } }

        // Initial checks
        checkOrientation();

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('touchstart', checkTouch);
            try { mql.removeEventListener('change', handleMQL); }
            catch (e) { try { mql.removeListener(handleMQL); } catch (e2) { } }
        };
    }, []);

    // Force show controls when entering landscape
    useEffect(() => {
        if (isLandscape && isTouch) {
            setShowControls(true);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isLandscape, isTouch]);

    // Fullscreen changed handler - purely monitoring now
    useEffect(() => {
        const handleFullscreenChange = () => {
            // Optional: sync state if needed
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const handleFullScreen = () => {
        if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) { /* Safari */
                containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current.msRequestFullscreen) { /* IE11 */
                containerRef.current.msRequestFullscreen();
            }
        }
    };

    // Close fullscreen when rotating back to portrait
    useEffect(() => {
        if (!isLandscape && document.fullscreenElement && isTouch) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }, [isLandscape, isTouch]);

    const handleMouseMove = () => {
        // On touch devices, controls are always visible or handled by tap
        if (isTouch) {
            // In portrait, force show. In landscape, handled by tap.
            if (!isLandscape) setShowControls(true);
            return;
        }
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const handleMouseLeave = () => {
        if (isTouch) return; // Don't hide on touch
        setShowControls(false);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };

    // Always show controls on touch devices ( Portrait only )
    useEffect(() => {
        if (isTouch && !isLandscape) {
            setShowControls(true);
        } else if (isTouch && isLandscape) {
            setShowControls(false); // Start hidden in landscape
        }
    }, [isTouch, isLandscape]);

    const handleProgressClick = (e) => {
        if (!playerRef.current || !duration) return;
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const seekTime = percentage * duration;

        playerRef.current.seekTo(seekTime, true);
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
                    disablekb: 1,
                    playsinline: 1
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

                                // Confirm playback for capture script
                                if (current > 1.0) {
                                    setPlaybackReady(true);
                                }
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
                height: '100dvh', // Use dvh for mobile address bar handling
                backgroundColor: backdropColor,
                zIndex: (isLandscape && isTouch) ? 3000 : 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                transition: 'background-color 0.3s'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
                if (isTouch && isLandscape) {
                    setShowControls(!showControls);
                }
            }}
        >
            {/* COLORSFUL - Top Left */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setShowCredit(true);
                    setTimeout(() => setShowCredit(false), 3000);
                }}
                style={{
                    position: 'fixed',
                    top: '28px',
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
                onMouseEnter={() => setIsBrandingHovered(true)}
                onMouseLeave={() => setIsBrandingHovered(false)}
            >
                COLORSFUL
            </div>

            {/* Close Button (X) - Internal - ONLY for Landscape Mobile (Immersive) */}
            {/* In all other modes, we rely on the main App Header X button */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                style={{
                    position: 'fixed',
                    top: '28px',
                    right: '30px',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    zIndex: 1002,
                    opacity: (isLandscape && isTouch && !showControls) ? 0 : 1, // Hide when controls hidden in immersive
                    pointerEvents: (isLandscape && isTouch && !showControls) ? 'none' : 'auto',
                    cursor: 'pointer',
                    transition: 'opacity 0.3s',
                    fontFamily: 'arial, sans-serif',
                    display: (isLandscape && isTouch) ? 'block' : 'none' // STRICTLY HIDDEN otherwise
                }}
            >
                ✕
            </div>

            {/* Credit Text */}
            <div style={{
                position: 'fixed',
                top: '56px',
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
                >
                    created by hérétique
                </a>
            </div>

            {/* Video Container - STRICTER STYLING */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                position: 'relative' // Ensure relative context
            }}>
                <div
                    ref={containerRef}
                    style={(isLandscape && isTouch) ? {
                        // LANDSCAPE MOBILE STYLES
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100dvh',
                        zIndex: 0,
                        cursor: 'none',
                        background: 'black'
                    } : {
                        // PORTRAIT / DESKTOP STYLES
                        position: 'relative',
                        width: '80vw',
                        maxWidth: '800px',
                        height: 'auto', // Allow height to be determined by aspect ratio
                        maxHeight: '80dvh', // Prevent it from being taller than screen
                        aspectRatio: '16/9',
                        zIndex: 'auto',
                        cursor: 'none',
                        flexShrink: 0,
                        background: 'transparent'
                    }}
                    className={`video-iframe-wrapper ${playbackReady ? 'playback-ready' : ''}`}
                >
                    {/* YouTube Iframe will be injected here */}

                    {/* Transparent Click Overlay */}
                    {isLandscape && isTouch && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 999,
                                background: 'transparent'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (showControls) {
                                    setShowControls(false);
                                    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                } else {
                                    setShowControls(true);
                                    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                    hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
                                }
                            }}
                        />
                    )}
                </div>

                {/* Progress Bar - Only visible on Desktop/Portrait */}
                {(!isTouch || !isLandscape) && (
                    <>
                        <div
                            onClick={handleProgressClick}
                            data-cursor="small"
                            style={{
                                width: '80vw',
                                maxWidth: '800px',
                                height: '3px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                marginTop: '15px', // More gap
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

                        {/* Desktop Controls (Play/Pause + Palette) - BELOW Progress Bar */}
                        <div style={{
                            width: '80vw',
                            maxWidth: '800px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '20px',
                            pointerEvents: showControls ? 'auto' : 'none',
                            opacity: showControls ? 1 : 0,
                            transition: 'opacity 0.3s',
                            zIndex: 1002
                        }}>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPlaying) playerRef.current?.pauseVideo();
                                    else playerRef.current?.playVideo();
                                    setIsPlaying(!isPlaying); // Optimistic update
                                }}
                                style={{
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.2rem',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {isPlaying ? 'PAUSE' : 'PLAY'}
                            </div>

                            <div
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(video.url); }}
                                style={{
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.2rem',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {isFav ? 'REMOVE FROM PALETTE' : 'ADD TO PALETTE'}
                            </div>
                        </div>
                    </>
                )}

                {/* Fullscreen Button for Mobile Portrait */}
                {isTouch && !isLandscape && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFullScreen();
                        }}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '30px',
                            color: 'white',
                            fontFamily: "var(--font-primary)",
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            letterSpacing: '0.2rem',
                            cursor: 'pointer',
                            opacity: showControls ? 1 : 0,
                            transition: 'opacity 0.3s'
                        }}
                    >
                        FULL SCREEN
                    </div>
                )}
            </div>

            {/* Artist Info - Adaptive Layout */}
            {(!isTouch || !isLandscape) ? (
                // DESKTOP & PORTRAIT: Standard corner layout (or stacked for portrait mobile if needed)
                <>
                    {/* Artist - Bottom Left */}
                    <div style={{
                        position: 'fixed',
                        bottom: isTouch ? '55px' : '30px', // Lift up on touch to make room for song
                        left: '30px',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3rem',
                        zIndex: 1001,
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s',
                        maxWidth: 'calc(100vw - 60px)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'left'
                    }}>
                        {fullArtist}
                    </div>

                    {/* Song Title - Bottom Right (Desktop) / Bottom Left (Mobile Portrait) */}
                    <div style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: isTouch ? 'auto' : '30px', // On touch, move to left
                        left: isTouch ? '30px' : 'auto', // On touch, align left
                        color: isTouch ? 'rgba(255,255,255,0.7)' : 'white', // Dimmer on mobile
                        fontSize: isTouch ? '0.9rem' : '1.2rem', // Smaller on mobile
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: isTouch ? '0.15rem' : '0.3rem',
                        zIndex: 1001,
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s',
                        maxWidth: 'calc(100vw - 60px)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: isTouch ? 'left' : 'right'
                    }}>
                        {songTitle}
                    </div>
                </>
            ) : (
                // LANDSCAPE MOBILE: Overlay
                <>
                    {/* Artist - Bottom Left */}
                    <div style={{
                        position: 'fixed',
                        bottom: '50px',
                        left: '40px',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3rem',
                        zIndex: 1001,
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)', // Add shadow for readability over video
                        pointerEvents: 'none'
                    }}>
                        {fullArtist}
                    </div>

                    {/* Song Title - Bottom Left (under artist) */}
                    <div style={{
                        position: 'fixed',
                        bottom: '25px',
                        left: '40px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2rem',
                        zIndex: 1001,
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        pointerEvents: 'none'
                    }}>
                        {songTitle}
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoModal;
