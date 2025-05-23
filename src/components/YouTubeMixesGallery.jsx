import React from 'react';
import '../styles/YouTubeMixesGallery.css';

const YOUTUBE_VIDEOS = [
  'BTqXM0srww8', // Desperate Fall
  'Qw8Qn6eQn1w', // The Dream of Night City
  '1Qw8Qn6eQn1w', // Poor Folk
  '2Qw8Qn6eQn1w', // Peace And Wind
  '3Qw8Qn6eQn1w', // Heavy Sand
];

const YouTubeMixesGallery = () => (
  <section className="youtube-mixes-gallery-section">
    <h2 className="youtube-mixes-gallery-title">
      <a href="https://www.youtube.com/@juliamerkusheva" target="_blank" rel="noopener noreferrer">
        My Mixes
      </a>
    </h2>
    <div className="youtube-mixes-gallery-feed">
      {YOUTUBE_VIDEOS.map((id) => (
        <div className="youtube-mix-card" key={id}>
          <iframe
            width="340"
            height="190"
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  </section>
);

export default YouTubeMixesGallery; 