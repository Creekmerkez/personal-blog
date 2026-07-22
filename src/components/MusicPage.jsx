import React, { useEffect } from 'react';
import '../styles/MusicPage.css';
import youtubeVideos from './youtubeData';

const MusicPage = () => {
  useEffect(() => {
    document.title = 'Music — Julia Merkusheva';
    return () => {
      document.title = 'MY';
    };
  }, []);

  return (
    <div className="music-page">
      <section className="music-hero">
        <h1 className="music-heading">Music</h1>
        <div className="music-divider" aria-hidden="true" />
        <p className="music-intro">
          Music has woven through every chapter of my life. As a DJ and music producer,
          I created 17 mixes — each one a sonic expression of a different period, a
          different feeling. While this chapter is currently on pause, these recordings
          remain a part of who I am. Explore them below.
        </p>
      </section>

      <section className="music-gallery-section" aria-label="Music mixes gallery">
        <div className="music-grid">
          {youtubeVideos.map((mix) => (
            <article className="mix-card" key={mix.id}>
              <div className="mix-video-wrapper">
                <iframe
                  src={mix.embedUrl}
                  title={`${mix.title} — DJ mix by Julia Merkusheva`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mix-info">
                <p className="mix-title">{mix.title}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="music-channel-row">
        <a
          href="https://www.youtube.com/@DJ.Merkuz"
          target="_blank"
          rel="noopener noreferrer"
          className="music-channel-link"
        >
          All mixes on YouTube
        </a>
      </div>
    </div>
  );
};

export default MusicPage;
