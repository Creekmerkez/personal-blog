import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeCarousel from './components/HomeCarousel';
import SiteNav from './components/SiteNav';
import MusicPage from './components/MusicPage';
import CeskeRealiePage from './components/CeskeRealiePage';
import './styles/App.css';

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <SiteNav />
        <Routes>
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
    </BrowserRouter>
  );
};

export default App;
