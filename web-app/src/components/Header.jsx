import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuToggle from './MenuToggle';
import { parseVideoTitle } from '../utils/titleParser';
import { processedVideos } from '../utils/nebulaConfig';
import { useFavorites } from '../contexts/FavoritesContext';

const Header = ({ isOpen, showMenuItems = true, onToggle, searchTerm, onSearchChange, onSearchFocus, onPaletteToggle, onReplayLast, hasReplayVideo, isPaletteActive, searchResults = [], hoveredVideo, setHoveredVideo, onSearchOpen }) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const navigate = useNavigate();
    const { favorites } = useFavorites();

    const isSomethingActive = isSearchActive || isPaletteActive;
    const isSomethingHovered = hoveredItem !== null;

    const getOpacity = (id, isActive) => {
        if (!showMenuItems) return 0;
        if (hoveredItem === id || isActive) return 1;
        if (isSomethingHovered || isSomethingActive) return 0.3;
        return 1;
    };

    const handleResultSelect = (video) => {
        const colorPath = `/${video.color.replace('#', '')}`;
        window.history.pushState({}, '', colorPath);
        onSearchChange('');
        setIsSearchActive(false);
        // Dispatch custom event to let App know a video was selected from search
        window.dispatchEvent(new CustomEvent('searchVideoSelect', { detail: video }));
    };

    const handleSearchClick = () => {
        setIsSearchActive(true);
        if (onSearchOpen) onSearchOpen();
        if (onSearchFocus) onSearchFocus();
    };

    // Calculate Palette Videos
    const paletteVideos = useMemo(() => {
        const favs = processedVideos.filter(pv => favorites.some(fav => fav.url === pv.url));
        const base = favs.length > 0 ? favs : processedVideos.slice(0, 15);
        return base.sort((a, b) => a.wheelY - b.wheelY); // Ascending
    }, [favorites]);

    return (
        <div style={{
            position: 'fixed',
            top: '30px',
            right: '30px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'center',
            gap: '20px'
        }}>
            {/* Menu Toggle - Always Right */}
            <div data-cursor="small" style={{ pointerEvents: 'auto' }}>
                <MenuToggle
                    isOpen={isOpen}
                    onClick={onToggle}
                    style={{ position: 'static' }}
                />
            </div>

            {/* Horizontal Menu Items - Directly to the left of the + toggle */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: '55px', // Identical gap between words
                opacity: (isOpen && showMenuItems) ? 1 : 0,
                transform: (isOpen && showMenuItems) ? 'translateX(0)' : 'translateX(20px)',
                pointerEvents: (isOpen && showMenuItems) ? 'auto' : 'none',
                visibility: (isOpen && showMenuItems) ? 'visible' : 'hidden',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                paddingRight: '10px'
            }}>
                {/* REPLAY LAST - Leftmost */}
                {hasReplayVideo && (
                    <div
                        onMouseEnter={() => setHoveredItem('replay')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={onReplayLast}
                        data-cursor="small"
                        style={{
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3rem',
                            fontFamily: "'Inter', sans-serif",
                            opacity: getOpacity('replay', false),
                            transition: 'opacity 0.3s ease'
                        }}
                    >
                        REPLAY LAST
                    </div>
                )}

                {/* PALETTE - Center */}
                <div
                    onMouseEnter={() => setHoveredItem('palette')}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                        position: 'relative',
                        opacity: getOpacity('palette', isPaletteActive),
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div
                        onClick={onPaletteToggle}
                        data-cursor="small"
                        style={{
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3rem',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        PALETTE
                    </div>

                    {/* Palette Dropdown List */}
                    {isPaletteActive && (
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            right: 0,
                            width: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end', // Align items to the right
                            gap: '0px', // Removed gap to allow seamless color transition
                            padding: '10px 0',
                            zIndex: 3000,
                            maxHeight: 'calc(100vh - 100px)',
                            overflowY: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}>
                            <style>{`.palette-scroll::-webkit-scrollbar { display: none; }`}</style>
                            {paletteVideos.map((video, idx) => {
                                const { fullArtist, songTitle } = parseVideoTitle(video.title);
                                const isHovered = hoveredVideo && (hoveredVideo.id === video.id || hoveredVideo.url === video.url);
                                return (
                                    <div
                                        key={video.id}
                                        onMouseEnter={() => setHoveredVideo(video)} // Use prop
                                        onMouseLeave={() => setHoveredVideo(null)} // Use prop
                                        onClick={() => handleResultSelect(video)}
                                        data-cursor="small"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'row-reverse', // Circle on right
                                            alignItems: 'center',
                                            gap: '15px',
                                            opacity: isHovered || !hoveredVideo ? 1 : 0.4,
                                            transition: 'all 0.2s ease',
                                            width: '100%',
                                            padding: '10px 0'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: video.color,
                                                flexShrink: 0,
                                                boxShadow: isHovered ? `0 0 10px ${video.color}` : 'none',
                                                transition: 'all 0.3s ease'
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', pointerEvents: 'none' }}>
                                            <div style={{
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.12rem',
                                                fontFamily: "'Inter', sans-serif"
                                            }}>
                                                {fullArtist}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255,255,255,0.4)',
                                                fontSize: '0.7rem',
                                                fontWeight: '500',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1rem',
                                                fontFamily: "'Inter', sans-serif"
                                            }}>
                                                {songTitle}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SEARCH - Rightmost */}
                <div
                    onMouseEnter={() => setHoveredItem('search')}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                        position: 'relative',
                        opacity: getOpacity('search', isSearchActive),
                        transition: 'opacity 0.3s ease',
                        width: '110px', // Fixed shorter width matching text
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end' // Align to right
                    }}
                >
                    {!isSearchActive ? (
                        <div
                            onClick={handleSearchClick}
                            data-cursor="small"
                            style={{
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3rem',
                                fontFamily: "'Inter', sans-serif"
                            }}
                        >
                            SEARCH
                        </div>
                    ) : (
                        <div style={{ width: '100%', position: 'relative' }}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onBlur={() => {
                                    if (!searchTerm) setIsSearchActive(false);
                                }}
                                autoFocus
                                placeholder="SEARCH"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.3rem',
                                    padding: '0 0 10px 0',
                                    width: '100%',
                                    outline: 'none',
                                    textTransform: 'uppercase',
                                    textAlign: 'right', // Align text right
                                    fontFamily: "'Inter', sans-serif"
                                }}
                            />
                            {/* Detached Underline */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                backgroundColor: 'rgba(255,255,255,0.4)'
                            }} />
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {isSearchActive && searchTerm && searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            right: 0, // Align to right
                            width: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end', // Align items to right
                            gap: '0px', // Removed gap for seamless hover
                            padding: '10px 0',
                            zIndex: 3000
                        }}>
                            {searchResults.slice(0, 10).map((video, idx) => {
                                const { fullArtist, songTitle } = parseVideoTitle(video.title);
                                const isHovered = hoveredVideo && (hoveredVideo.id === video.id || hoveredVideo.url === video.url);
                                return (
                                    <div
                                        key={video.id}
                                        onMouseEnter={(e) => {
                                            if (setHoveredVideo) setHoveredVideo(video); // Use prop
                                        }}
                                        onMouseLeave={() => {
                                            if (setHoveredVideo) setHoveredVideo(null); // Use prop
                                        }}
                                        onClick={() => handleResultSelect(video)}
                                        data-cursor="small"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'row-reverse', // Circle on right
                                            alignItems: 'center',
                                            gap: '15px',
                                            opacity: isHovered || !hoveredVideo ? 1 : 0.4,
                                            transition: 'all 0.2s ease',
                                            width: '100%',
                                            padding: '10px 0'
                                        }}
                                    >
                                        <div
                                            className="search-result-circle"
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: video.color,
                                                flexShrink: 0,
                                                boxShadow: isHovered ? `0 0 10px ${video.color}` : 'none',
                                                transition: 'all 0.3s ease'
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', pointerEvents: 'none' }}>
                                            <div style={{
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.12rem',
                                                fontFamily: "'Inter', sans-serif"
                                            }}>
                                                {fullArtist}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255,255,255,0.4)',
                                                fontSize: '0.7rem',
                                                fontWeight: '500',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1rem',
                                                fontFamily: "'Inter', sans-serif"
                                            }}>
                                                {songTitle}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
