import React from 'react';
import BooksSection from './BooksSection';
import '../styles/MainContent.css';

const MainContent = () => {
  return (
    <main className="main-content">
      <section className="content-section">
        <div className="bio-content centered-bio">
          <p className="bio-narrow">
            Hi there! I'm a <span className="highlight">Test Automation Engineer</span> with over a decade of experience in IT, but my journey extends beyond technology into the realms of music, writing, and conscious living.
          </p>
          <p className="bio-wide">
            Music has always been a vital part of my life. Through <span className="highlight">DJing</span>, I've created <span className="highlight">17 mixes</span>, each one a unique expression of creativity and emotion. While currently on pause, this passion remains an essential part of who I am.
          </p>
          <p className="bio-wide">
            <span className="highlight">Prague</span> is my home, where I live with my <span className="highlight">wonderful husband and our son</span> who constantly inspires me. Together, we embrace a lifestyle centered on freedom, flexibility, and mindful choices.
          </p>
          <p className="bio-wide">
            Writing <span className="highlight">children's books</span> brings me immense joy. Each story I write aims to spark curiosity and imagination in young minds. My books reflect my belief in the power of storytelling to shape young perspectives.
          </p>
          <p className="bio-wide">
            Living consciously guides my choices - from maintaining a <span className="highlight">meat-free diet</span> to ensuring everything I use aligns with <span className="highlight">cruelty-free</span> values. This commitment reflects my deep respect for all forms of life.
          </p>
          <p className="bio-narrow">
            I also help others create meaningful digital experiences through AI-powered solutions. If you're interested in crafting something unique and beautiful, I'd love to collaborate.
          </p>
          <div className="signature">
            Yulia M.<span className="signature-flourish">~</span>
          </div>
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
        </div>
      </section>
      <BooksSection />
    </main>
  );
};

export default MainContent; 