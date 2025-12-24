import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Palette from './components/Palette';
import Bloc from './components/Bloc';
import Blind from './components/Blind';
import Point from './components/Point';
import Gradient from './components/Gradient';
import LogoPage from './components/LogoPage';
import SecretPage from './components/SecretPage';
import CustomCursor from './components/CustomCursor';
import MobileOverlay from './components/MobileOverlay';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LogoPage />} />
      <Route path="/wheel" element={<Blind />} />
      <Route path="/bloc" element={<Bloc />} />
      <Route path="/palette" element={<Palette />} />
      <Route path="/point" element={<Point />} />
      <Route path="/gradient" element={<Gradient />} />
      <Route path="/secret" element={<SecretPage />} />
    </Routes>
  );
}

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      {isMobile && <MobileOverlay />}
      <CustomCursor />
      <AppContent />
    </Router>
  );
}

export default App;
