import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processedVideos } from '../utils/nebulaConfig';
import { parseVideoTitle } from '../utils/titleParser';
import { ASSET_BASE_URL } from '../config/assets';
import { useVideo } from '../contexts/VideoContext';

const VideoCard = ({ video }) => {
    const { openVideo, setOriginRoute } = useVideo();
    const [isHovered, setIsHovered] = useState(false);
    const videoId = video.url.split('v=')[1]?.split('&')[0];
    const { fullArtist, songTitle } = parseVideoTitle(video.title);

    // Asset paths
    const jpgPath = `${ASSET_BASE_URL}captures/${videoId}_45s.jpg`;
    const gifPath = `${ASSET_BASE_URL}captures/${videoId}_45s.gif`;

    const handleClick = () => {
        setOriginRoute('/gridhistory'); // Explicitly set origin before opening
        openVideo(video, { backdropColor: 'transparent' });
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                cursor: 'pointer',
                overflow: 'hidden',
                borderRadius: '0px',
                backgroundColor: '#1a1a1a'
            }}
        >
            <img
                src={isHovered ? gifPath : jpgPath}
                alt={`${fullArtist} - ${songTitle}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.2s',
                    opacity: 1
                }}
                onError={(e) => {
                    if (e.target.src !== `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`) {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                }}
            />
        </div>
    );
};

const GridHistory = () => {
    const [minTileWidth, setMinTileWidth] = useState(300);
    const [gifProgress, setGifProgress] = useState({ generated: 0, total: 0, isGenerating: false });
    const [videosWithTimestamps, setVideosWithTimestamps] = useState([]);
    const [loading, setLoading] = useState(true);

    // Poll for GIF generation progress
    useEffect(() => {
        const checkProgress = async () => {
            try {
                const response = await fetch('/gif-progress.json');
                if (response.ok) {
                    const data = await response.json();
                    setGifProgress({
                        generated: data.generated || 0,
                        total: data.total || 0,
                        isGenerating: data.isGenerating || false
                    });
                }
            } catch (error) {
                // Progress file doesn't exist yet
            }
        };

        checkProgress();
        const interval = setInterval(checkProgress, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, []);

    // Fetch GIF modification times and sort
    useEffect(() => {
        const fetchTimestamps = async () => {
            const videosWithTime = await Promise.all(
                processedVideos.map(async (video) => {
                    const videoId = video.url.split('v=')[1]?.split('&')[0];
                    const gifPath = `${ASSET_BASE_URL}captures/${videoId}_45s.gif`;

                    try {
                        const response = await fetch(gifPath, { method: 'HEAD' });
                        if (response.ok) {
                            const lastModified = response.headers.get('Last-Modified');
                            return {
                                ...video,
                                timestamp: lastModified ? new Date(lastModified).getTime() : 0,
                                hasGif: true
                            };
                        }
                    } catch (error) {
                        // GIF doesn't exist yet
                    }

                    return {
                        ...video,
                        timestamp: 0,
                        hasGif: false
                    };
                })
            );

            // Sort by timestamp (newest first), then filter out videos without GIFs
            const sorted = videosWithTime
                .filter(v => v.hasGif)
                .sort((a, b) => b.timestamp - a.timestamp);

            setVideosWithTimestamps(sorted);
            setLoading(false);
        };

        fetchTimestamps();
    }, []);

    const handleIncreaseTiles = () => {
        setMinTileWidth(prev => Math.max(100, prev - 50));
    };

    const handleDecreaseTiles = () => {
        setMinTileWidth(prev => Math.min(800, prev + 50));
    };

    if (loading) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0a',
                color: 'white',
                fontFamily: 'var(--font-primary)',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                Loading GIF History...
            </div>
        );
    }

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            background: '#0a0a0a',
            overflow: 'auto'
        }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 200,
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    GIF History ({videosWithTimestamps.length})
                </div>

                {/* GIF Generation Progress Bar */}
                {gifProgress.isGenerating && gifProgress.total > 0 && (
                    <div style={{
                        flex: 1,
                        maxWidth: '400px',
                        marginLeft: '30px'
                    }}>
                        <div style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.6)',
                            marginBottom: '5px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Generating GIFs: {gifProgress.generated}/{gifProgress.total}
                        </div>
                        <div style={{
                            width: '100%',
                            height: '3px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(gifProgress.generated / gifProgress.total) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #ff006e, #8338ec)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}

                <div style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'rgba(255,255,255,0.4)'
                }}>
                    Sorted by Most Recent
                </div>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
                gap: '0px',
                width: '100%',
                paddingBottom: '100px',
                transition: 'all 0.3s ease'
            }}>
                {videosWithTimestamps.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>

            {/* Controls */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                display: 'flex',
                gap: '10px',
                zIndex: 100
            }}>
                <button
                    onClick={handleDecreaseTiles}
                    title="Moins"
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', fontSize: '20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)', transition: 'background 0.2s',
                        fontFamily: 'var(--font-primary)'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                >
                    -
                </button>
                <button
                    onClick={handleIncreaseTiles}
                    title="Plus"
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', fontSize: '20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)', transition: 'background 0.2s',
                        fontFamily: 'var(--font-primary)'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default GridHistory;
