import React, { useEffect, useState } from 'react';
import '../styles/HolographicGallery.css';
import videos from './youtubeData';
import HoloClose from './HoloClose';
import usePhone from './usePhone';

const VIDEO_SLOTS = [
  { left: 6, top: 8, w: 26, h: 28, z: 3 },
  { left: 35, top: 4, w: 28, h: 32, z: 4 },
  { left: 66, top: 9, w: 24, h: 28, z: 3 },
  { left: 10, top: 46, w: 26, h: 30, z: 4 },
  { left: 38, top: 40, w: 28, h: 34, z: 5 },
  { left: 68, top: 50, w: 22, h: 24, z: 3 },
];

const HolographicYouTube = ({ open, onClose, originRect }) => {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(null);
  // On a phone the collage becomes a YouTube-style list.
  const phone = usePhone();

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (render) {
      setVisible(false);
      const delay = window.innerWidth < 600 ? 0 : 520;
      const timer = setTimeout(() => {
        setRender(false);
        setExpanded(null);
      }, delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, render]);

  // Gated on the `open` prop rather than `render`. `render` stays true through
  // the exit animation, unmounted by a setTimeout only as punctual as the main
  // thread allows — measured firing 2-3s late against its nominal 520ms while
  // the carousel's rAF loop was busy, leaving the page unscrollable long after
  // the panel had faded out. `open` flips the instant the user opens or closes,
  // so the lock lands on exactly the same frame it always did when opening
  // (gating on `visible` instead moved it a frame later, into the entrance
  // animation, and the resulting reflow made the panel's controls jitter) while
  // still releasing the moment closing begins.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!render) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (expanded) setExpanded(null);
      else onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [render, expanded, onClose]);

  if (!render) return null;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const ox = originRect ? originRect.left + originRect.width / 2 : cx;
  const oy = originRect ? originRect.top + originRect.height / 2 : cy;
  const originStyle = { '--dx': `${ox - cx}px`, '--dy': `${oy - cy}px` };

  return (
    <div
      className={`holo-gallery-stage ${visible ? 'visible' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="holo-gallery-panel holo-youtube-panel"
        style={originStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="YouTube gallery"
      >
        <span className="holo-corner tl" aria-hidden="true" />
        <span className="holo-corner tr" aria-hidden="true" />
        <span className="holo-corner bl" aria-hidden="true" />
        <span className="holo-corner br" aria-hidden="true" />

        <div className="holo-rail left" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>
        <div className="holo-rail right" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>

        <header className="holo-gallery-header holo-youtube-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">MY MUSIC</h2>
            <span className="holo-gallery-subtitle">Music I Created</span>
          </div>

          <span className="holo-gallery-counter">
            {String(videos.length).padStart(2, '0')} / {String(videos.length).padStart(2, '0')}
          </span>

          <a
            href="https://www.youtube.com/@DJ.Merkuz"
            target="_blank"
            rel="noopener noreferrer"
            className="holo-filter holo-filter-link"
          >
            CHANNEL
          </a>
          <HoloClose onClose={onClose} />
        </header>

        {phone ? (
          <div className="holo-yt-list">
            {videos.map((video) => (
              <button key={video.id} type="button" className="holo-yt-item" onClick={() => setExpanded(video)} aria-label={`Play ${video.title}`}>
                <span className="holo-yt-thumb">
                  <img src={video.thumbnail} alt="" loading="lazy" />
                  <svg className="holo-yt-play" viewBox="0 0 68 48" aria-hidden="true">
                    <path d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.6 8.6 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.6 8.6 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.6 8.6 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#f00" />
                    <path d="M27 34.3 44.7 24 27 13.7z" fill="#fff" />
                  </svg>
                </span>
                <span className="holo-yt-meta">
                  <span className="holo-yt-title">{video.title}</span>
                  <span className="holo-yt-channel">DJ Merkuz · YouTube</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
        <div className="holo-collage holo-video-collage">
          {videos.map((video, index) => {
            const slot = VIDEO_SLOTS[index];
            return (
              <button
                key={video.id}
                type="button"
                className="holo-photo holo-video-tile"
                style={{
                  left: `${slot.left}%`,
                  top: `${slot.top}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  zIndex: slot.z,
                }}
                onClick={() => setExpanded(video)}
                aria-label={`Play ${video.title}`}
              >
                <img src={video.thumbnail} alt={video.title} loading="lazy" />
                <span className="holo-photo-sheen" aria-hidden="true" />
                <span className="holo-video-overlay" aria-hidden="true">
                  <span className="holo-video-label">{video.title}</span>
                </span>
              </button>
            );
          })}
        </div>
        )}

        <div className={`holo-lightbox ${expanded ? 'visible' : ''}`} onClick={() => setExpanded(null)}>
          {expanded && (
            <figure className="holo-lightbox-figure holo-video-lightbox-figure" onClick={(event) => event.stopPropagation()}>
              <div className="holo-video-frame-wrap">
                <iframe
                  src={expanded.autoplayEmbedUrl}
                  title={`${expanded.title} video player`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
              <figcaption className="holo-lightbox-caption">{expanded.title}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolographicYouTube;