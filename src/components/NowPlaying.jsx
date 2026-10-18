import React, { useState } from 'react';
import '../styles/NowPlaying.css';

// One song on the homepage, played through YouTube's own embed of the official
// video, which is what makes it legal to offer. YouTube's rules want the player
// visible and at least 200×200, so it is a small card, not background audio.
// Browsers don't let a site start sound by itself, so it starts on a tap, and
// nothing is requested from YouTube before that (youtube-nocookie, like My Music).
const SONG = { videoId: 'W3_c4-4OMbM', artist: 'DJ Shadow', title: 'Six Days' };

const NowPlaying = ({ song = SONG }) => {
  const [playing, setPlaying] = useState(false);
  if (!song.videoId) return null;
  const name = `${song.artist} — ${song.title}`;

  if (!playing) {
    return (
      <button type="button" className="now-playing-pill" onClick={() => setPlaying(true)} aria-label={`Play ${name}`}>
        <span className="now-playing-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg>
        </span>
        <span className="now-playing-name">{name}</span>
      </button>
    );
  }

  return (
    <div className="now-playing-card" role="region" aria-label={`Music: ${name}`}>
      <button type="button" className="now-playing-close" onClick={() => setPlaying(false)} aria-label="Stop and close the music">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${song.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
        title={`${name} (YouTube)`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default NowPlaying;
