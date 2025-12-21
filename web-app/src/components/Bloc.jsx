import React, { useState } from 'react';
import videosData from '../data/videos.json';
import VideoModal from './VideoModal';

const Bloc = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideoId, setHoveredVideoId] = useState(null);

    // Filter valid entries if necessary
    const filteredVideos = videosData.filter(v => v.color && v.thumbnail);

    return (
        <div style={{
            width: '100vw',
            minHeight: '100vh',
            background: '#0a0a0a',
            padding: '40px', // Space for nav
            paddingTop: '100px',
            boxSizing: 'border-box'
        }}>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '2px', // Minimal gap for "Bloc" feel
                width: '100%' // Full width
            }}>
                {filteredVideos.map((video, index) => (
                    <div
                        key={index}
                        onMouseEnter={() => setHoveredVideoId(index)}
                        onMouseLeave={() => setHoveredVideoId(null)}
                        onClick={() => setSelectedVideo(video)}
                        style={{
                            backgroundColor: video.color,
                            aspectRatio: '1', // Square blocks
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s ease, z-index 0.2s',
                            zIndex: hoveredVideoId === index ? 10 : 1,
                            transform: hoveredVideoId === index ? 'scale(1.2)' : 'scale(1)',
                            borderRadius: '4px' // Slight rounding
                        }}
                    >
                        {hoveredVideoId === index && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-40px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'black',
                                color: 'white',
                                padding: '5px 10px',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
                                borderRadius: '4px',
                                pointerEvents: 'none',
                                zIndex: 20
                            }}>
                                {video.title.split('|')[0].trim()}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default Bloc;
