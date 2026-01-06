import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import videos from '../data/videos.json';
import { parseVideoTitle } from '../utils/titleParser';
import { useVideo } from '../contexts/VideoContext';
import { useFavorites } from '../contexts/FavoritesContext';

const Menu = ({ isOpen, onClose, searchTerm, setSearchTerm }) => {
    // internal search removed, using prop
    const [results, setResults] = useState([]);
    const { openVideo } = useVideo();
    const { favorites } = useFavorites();
    const navigate = useNavigate();

    useEffect(() => {
        if (!searchTerm || !searchTerm.trim()) {
            setResults([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = videos.filter(video => {
            const { fullArtist, songTitle } = parseVideoTitle(video.title);
            return (
                fullArtist.toLowerCase().includes(lowerTerm) ||
                songTitle.toLowerCase().includes(lowerTerm) ||
                video.title.toLowerCase().includes(lowerTerm)
            );
        }).slice(0, 50);

        setResults(filtered);
    }, [searchTerm, favorites]);

    // "Ditch the rest" - Show nothing if no search term, even if "open" (open just reveals header)
    if (!isOpen || !searchTerm.trim()) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '80px', // Below header
            right: '30px', // Aligned with header elements
            width: '300px', // Compact width
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: 'rgba(0,0,0,0.9)', // Dark background for readability
            backdropFilter: 'blur(10px)',
            zIndex: 1900,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            overflow: 'hidden',
            color: 'white',
            fontFamily: "var(--font-primary)"
        }}>
            <div style={{
                overflowY: 'auto',
                padding: '10px'
            }}>
                {results.length > 0 ? results.map((video, index) => {
                    const { fullArtist, songTitle } = parseVideoTitle(video.title);
                    return (
                        <div
                            key={index}
                            onClick={() => {
                                const colorSlug = video.color.replace('#', '');
                                navigate(`/${colorSlug}`);
                                onClose();
                                setSearchTerm(''); // Clear search on selection
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '10px',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: video.color,
                                flexShrink: 0
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{fullArtist}</span>
                                <span style={{ opacity: 0.7, fontSize: '0.7rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{songTitle}</span>
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ padding: '10px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                        NO RESULTS
                    </div>
                )}
            </div>
        </div>
    );
};

export default Menu;
