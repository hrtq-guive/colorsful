import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Palette from './components/Palette';
import Bloc from './components/Bloc';
import Blind from './components/Blind';
import Point from './components/Point';
import Gradient from './components/Gradient';
import LogoPage from './components/LogoPage';
import SecretPage from './components/SecretPage';
import CustomCursor from './components/CustomCursor';
import MobileOverlay from './components/MobileOverlay';
import PreviousHomePage from './components/PreviousHomePage';
import Menu from './components/Menu';
import MenuToggle from './components/MenuToggle';
import VideoModal from './components/VideoModal';
import { VideoProvider, useVideo } from './contexts/VideoContext';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LogoPage />} />
      <Route path="/previoushome" element={<PreviousHomePage />} />
      <Route path="/wheel" element={<Blind />} />
      <Route path="/bloc" element={<Bloc />} />
      <Route path="/palette" element={<Palette />} />
      <Route path="/palette/:color" element={<Palette />} />
      <Route path="/point" element={<Point />} />
      <Route path="/gradient" element={<Gradient />} />
      <Route path="/secret" element={<SecretPage />} />
      <Route path="/:color" element={<LogoPage />} />
    </Routes>
  );
}

import { parseVideoTitle } from './utils/titleParser';
import videos from './data/videos.json';
import { processedVideos } from './utils/nebulaConfig';
import Header from './components/Header';

function GlobalLayer() {
  const navigate = useNavigate();
  const { currentVideo, openVideo, closeVideo, options } = useVideo();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  // Check if there's a video to replay
  const hasReplayVideo = !!sessionStorage.getItem('lastPlayedVideo');

  const handleToggle = () => {
    if (currentVideo) {
      // Close video when it's playing
      if (options.onClose) options.onClose();
      closeVideo();
      navigate('/');
    } else {
      // Toggle menu - if closing, also clear active overlays
      if (isMenuOpen) {
        setShowPalette(false);
        setShowPalette(false);
        setSearchTerm('');
        setHoveredVideo(null);
      }
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const handleSearchFocus = () => {
    if (!isMenuOpen) setIsMenuOpen(true);
  };

  // Auto-close menu when video opens
  useEffect(() => {
    if (currentVideo) {
      setIsMenuOpen(false);
    }
  }, [currentVideo]);

  // Handle video selection from Header's search dropdown
  useEffect(() => {
    const handleSearchSelect = (e) => {
      const video = e.detail;
      openVideo(video, { backdropColor: 'transparent' });
      navigate(`/${video.color.replace('#', '')}`);
    };
    window.addEventListener('searchVideoSelect', handleSearchSelect);
    return () => window.removeEventListener('searchVideoSelect', handleSearchSelect);
  }, [openVideo, navigate]);

  // Calculate search results
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      setSearchResults([]);
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
    }).slice(0, 20); // Limit to 20 results to prevent label overcrowding

    // Map filtered results to processedVideos to get positioning data
    const enrichedResults = filtered.map(video => {
      const processed = processedVideos.find(pv => pv.url === video.url);
      return processed || video; // Use processed version if available, otherwise raw
    }).filter(v => v.wheelX !== undefined); // Only include videos with position data

    setSearchResults(enrichedResults);
  }, [searchTerm]);

  const showX = !!currentVideo || isMenuOpen;

  const handleVideoClose = () => {
    if (options.onClose) options.onClose();
    closeVideo();
    navigate('/');
  };

  const handleReplayLast = () => {
    // Get last played video from sessionStorage (session only)
    const lastVideo = sessionStorage.getItem('lastPlayedVideo');
    if (lastVideo) {
      const video = JSON.parse(lastVideo);
      openVideo(video, { backdropColor: 'transparent' });
      navigate(`/${video.color.replace('#', '')}`);
    }
  };

  return (
    <>
      <Header
        isOpen={showX}
        showMenuItems={isMenuOpen}
        onToggle={handleToggle}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchFocus={handleSearchFocus}
        onPaletteToggle={() => {
          if (!showPalette) {
            setSearchTerm('');
            setHoveredVideo(null);
          }
          setShowPalette(!showPalette);
        }}
        onSearchOpen={() => {
          setShowPalette(false);
          setHoveredVideo(null);
        }}
        onReplayLast={handleReplayLast}
        hasReplayVideo={hasReplayVideo}
        isPaletteActive={showPalette}
        searchResults={searchResults}
        hoveredVideo={hoveredVideo}
        setHoveredVideo={setHoveredVideo}
      />

      {/* Global Hover Background for Search and Palette */}
      {hoveredVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: hoveredVideo.color,
          opacity: 1,
          transition: 'opacity 0.6s ease, background-color 0.6s ease',
          pointerEvents: 'none',
          zIndex: 1500
        }} />
      )}

      {showPalette && isMenuOpen && <Palette
        setShowPalette={setShowPalette}
        showFullPalette={showPalette}
        hoveredVideo={hoveredVideo}
        setHoveredVideo={setHoveredVideo}
        onClose={() => {
          setShowPalette(false);
          setSearchTerm('');
          setHoveredVideo(null);
          navigate('/');
        }}
      />}
      {currentVideo && (
        <VideoModal
          video={currentVideo}
          onClose={handleVideoClose}
          backdropColor={options.backdropColor || 'rgba(0,0,0,0.95)'}
        />
      )}
    </>
  );
}

import { FavoritesProvider } from './contexts/FavoritesContext';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <VideoProvider>
        <FavoritesProvider>
          {isMobile && <MobileOverlay />}
          <CustomCursor />
          <GlobalLayer />
          <AppContent />
        </FavoritesProvider>
      </VideoProvider>
    </Router>
  );
}

export default App;
