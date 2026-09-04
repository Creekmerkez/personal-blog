import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomeCarousel from './components/HomeCarousel';
import SiteNav from './components/SiteNav';
import MusicPage from './components/MusicPage';
import CeskeRealiePage from './components/CeskeRealiePage';
import './styles/App.css';

// A route change otherwise swaps the entire page tree in one frame — an
// unexplained jump with nothing to bridge the before/after states. Keying
// on the pathname remounts this wrapper on every navigation, so its
// route-fade-in CSS animation (App.css) plays each time.
const AppRoutes = () => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade">
      <Routes location={location}>
        <Route path="/" element={
          <>
            <HomeCarousel />
          </>
        } />
        <Route path="/music" element={
          <>
            <MusicPage />
          </>
        } />
        <Route path="/ceske-realie" element={
          <>
            <CeskeRealiePage />
          </>
        } />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <SiteNav />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};

export default App;
