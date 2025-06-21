import React from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import './styles/App.css';

const App = () => {
  return (
    <div className="app">
      <Header />
      <div className="header-spacer"></div>
      <MainContent />
      <Footer />
    </div>
  );
};

export default App; 