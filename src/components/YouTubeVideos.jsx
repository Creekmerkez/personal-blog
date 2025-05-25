import React, { useState, useEffect } from 'react';
import '../styles/YouTubeVideos.css';

const videoLinks = [
  'https://youtu.be/BTqXM0srww8',
  'https://youtu.be/IU_USVhpDOE',
  'https://youtu.be/Ums3mwdrFJM',
  'https://youtu.be/IAd9StDN85Q?si=Jjh8rBZGHQR-miUf',
  'https://youtu.be/tLjAKEfK-xg?si=ezBuT7Q4olGC2U9J',
];

function getEmbedUrl(link) {
  // Extract the video ID from youtu.be or youtube.com URLs
  const match = link.match(/youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?)([\w-]{11})/);
  const id = match ? match[1] : '';
  return id
    ? `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1&autoplay=0`
    : '';
}

const YouTubeVideos = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    // Mobile: keep the carousel as before
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      if (!isInitialized) setIsInitialized(true);
    }, [isInitialized]);

    const handlePrev = () => {
      setCurrentIndex((prev) => (prev === 0 ? videoLinks.length - 1 : prev - 1));
    };
    const handleNext = () => {
      setCurrentIndex((prev) => (prev === videoLinks.length - 1 ? 0 : prev + 1));
    };

    return (
      <div className="youtube-section">
        <div className="youtube-carousel">
          <button className="carousel-button prev" onClick={handlePrev} aria-label="Previous video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="video-container">
            <iframe
              key={currentIndex}
              src={getEmbedUrl(videoLinks[currentIndex])}
              title={`YouTube Video ${currentIndex + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
          <button className="carousel-button next" onClick={handleNext} aria-label="Next video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="carousel-dots">
          {videoLinks.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: show all videos in a row, centered, full width, no carousel, no dots, no title
  return (
    <div className="youtube-section youtube-section-desktop">
      <div className="youtube-videos-row">
        {videoLinks.map((link, idx) => (
          <div className="video-container" key={idx}>
            <iframe
              src={getEmbedUrl(link)}
              title={`YouTube Video ${idx + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        ))}
      </div>
      <div className="youtube-more-btn-row">
        <a
          href="https://www.youtube.com/@juliamerkusheva"
          target="_blank"
          rel="noopener noreferrer"
          className="youtube-more-btn"
        >
          MORE
        </a>
      </div>
    </div>
  );
};

export default YouTubeVideos; 