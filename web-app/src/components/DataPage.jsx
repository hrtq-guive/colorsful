import React from 'react';
import videosData from '../data/videos.json';
import { parseVideoTitle } from '../utils/titleParser';

const DataPage = () => {
    // Filter videos that have at least some data
    const videosWithData = videosData.filter(v => v.color || v.hex45);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#0a0a0a',
            color: 'white',
            overflow: 'auto'
        }}>
            {/* Content Wrapper */}
            <div style={{ padding: '40px 20px' }}>
                {/* Header */}
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto 40px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '20px'
                }}>
                    <h1 style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '24px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        marginBottom: '10px'
                    }}>
                        Color Data Comparison
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '1px'
                    }}>
                        {videosWithData.length} videos • 1s vs 45s color comparison
                    </p>
                </div>

                {/* Data Grid */}
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {videosWithData.map((video, index) => {
                        const videoId = video.url.split('v=')[1]?.split('&')[0];
                        const { fullArtist, songTitle } = parseVideoTitle(video.title);

                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 170px 100px 170px 100px',
                                    gap: '20px',
                                    alignItems: 'center',
                                    padding: '20px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Video Info */}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontFamily: 'var(--font-primary)',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {fullArtist}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-primary)',
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.6)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {songTitle}
                                    </div>
                                </div>

                                {/* 1s Screenshot */}
                                <div style={{ textAlign: 'center' }}>
                                    {videoId && (
                                        <img
                                            src={`/captures/${videoId}_1s.jpg`}
                                            alt="1s"
                                            style={{
                                                width: '150px',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '2px solid rgba(255,255,255,0.1)'
                                            }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}
                                    <div style={{
                                        fontFamily: 'var(--font-primary)',
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.4)',
                                        marginTop: '4px',
                                        letterSpacing: '1px'
                                    }}>
                                        1s
                                    </div>
                                </div>

                                {/* 1s Color */}
                                <div style={{ textAlign: 'center' }}>
                                    {video.color && (
                                        <>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                background: video.color,
                                                borderRadius: '4px',
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                margin: '0 auto 8px'
                                            }} />
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontSize: '11px',
                                                color: 'rgba(255,255,255,0.8)'
                                            }}>
                                                {video.color}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 45s Screenshot */}
                                <div style={{ textAlign: 'center' }}>
                                    {videoId && (
                                        <img
                                            src={`/captures/${videoId}_45s.jpg`}
                                            alt="45s"
                                            style={{
                                                width: '150px',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '2px solid rgba(255,255,255,0.1)'
                                            }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}
                                    <div style={{
                                        fontFamily: 'var(--font-primary)',
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.4)',
                                        marginTop: '4px',
                                        letterSpacing: '1px'
                                    }}>
                                        45s
                                    </div>
                                </div>

                                {/* 45s Color */}
                                <div style={{ textAlign: 'center' }}>
                                    {video.hex45 ? (
                                        <>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                background: video.hex45,
                                                borderRadius: '4px',
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                margin: '0 auto 8px'
                                            }} />
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontSize: '11px',
                                                color: 'rgba(255,255,255,0.8)'
                                            }}>
                                                {video.hex45}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            fontFamily: 'var(--font-primary)',
                                            fontSize: '10px',
                                            color: 'rgba(255,255,255,0.3)',
                                            fontStyle: 'italic'
                                        }}>
                                            N/A
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DataPage;
