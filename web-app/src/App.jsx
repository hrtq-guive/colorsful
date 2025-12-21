import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Palette from './components/Palette';
import Bloc from './components/Bloc';
import Blind from './components/Blind';
import Navigation from './components/Navigation';
import CustomCursor from './components/CustomCursor';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Blind />} />
      {/* Keep other routes for internal dev but they won't be linked */}
      <Route path="/bloc" element={<Bloc />} />
      <Route path="/palette" element={<Palette />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <CustomCursor />
      <AppContent />
    </Router>
  );
}

export default App;
