import React, { useState } from 'react';
import BooksSection from './BooksSection';
import InstagramWidget from './InstagramWidget';
import QAChat from './QAChat/QAChat';
import DraggableButton from './QAChat/DraggableButton';
import '../styles/MainContent.css';

const MainContent = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="main-content">
      {isChatOpen && <QAChat onClose={() => setIsChatOpen(false)} />}
      <DraggableButton onClick={() => setIsChatOpen(true)}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
        </svg>
      </DraggableButton>
      <section className="content-section">
        <div className="ps-section">
          <div className="ps-heading">P.S.</div>
          <p>I'm Ukrainian, and I dream of a free, peaceful Ukraine — free from Russian aggression.</p>
          <p>If you'd like to support our fight for freedom, please consider donating to our defenders here:</p>
          <p>
            <a href="https://savelife.in.ua/en/donate/" target="_blank" rel="noopener noreferrer" className="ps-link">Come Back Alive Foundation</a>
          </p>
          <p>Many animals also suffer because of the war. Help protect them by donating to:</p>
          <p>
            <a href="https://uanimals.org/en/donate/" target="_blank" rel="noopener noreferrer" className="ps-link">UAnimals</a>
          </p>
          <p className="ps-thanks">Thank you for standing with us. <span className="ps-heart" style={{color:'#ffd700'}}>💛</span><span className="ps-heart" style={{color:'#0057b7', marginLeft:'0.2em'}}>💙</span></p>
        </div>
      </section>
      <BooksSection />
      <InstagramWidget />
    </main>
  );
};

export default MainContent;
