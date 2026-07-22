import React, { useEffect, useRef, useState } from 'react';
import '../styles/HomeCarousel.css';
import '../styles/HolographicGallery.css';

const HolographicPlayer = ({ open, videoEl, onClose, originRect }) => {
  const containerRef = useRef(null);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (render) {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), window.innerWidth < 600 ? 0 : 520);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, render]);

  useEffect(() => {
    if (!render) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [render, onClose]);

  useEffect(() => {
    if (!render) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [render]);

  useEffect(() => {
    if (!render) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    // If a pre-created video element is provided, move it into the container.
    if (videoEl) {
      // Ensure the element isn't already attached elsewhere, and force audio on.
      try {
        try { videoEl.muted = false; } catch { /* ignore */ }
        try { videoEl.volume = 1; } catch { /* ignore */ }
        try { videoEl.style.display = ''; } catch { /* ignore */ } // Remove display: none
        container.appendChild(videoEl);
      } catch { /* ignore */ }
    }

    return () => {
      if (videoEl && videoEl.parentNode === container) {
        try {
          videoEl.pause();
          container.removeChild(videoEl);
        } catch { /* ignore */ }
      }
    };
  }, [render, videoEl]);

  if (!render) return null;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const ox = originRect ? originRect.left + originRect.width / 2 : cx;
  const oy = originRect ? originRect.top + originRect.height / 2 : cy;
  const originStyle = { '--dx': `${ox - cx}px`, '--dy': `${oy - cy}px` };

  return (
    <div className={`holo-gallery-stage ${visible ? 'visible' : ''}`} onClick={onClose} role="presentation">
      <div
        className="holo-gallery-panel holo-about-panel"
        style={originStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="About video"
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

        <header className="holo-gallery-header holo-about-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">ABOUT</h2>
            <span className="holo-gallery-subtitle">Watch Intro</span>
          </div>

          <span className="holo-gallery-counter">INTRO</span>
        </header>

        <div className="holo-about-body">
          <div ref={containerRef} className="holo-about-video-frame" />
        </div>
      </div>
    </div>
  );
};

export default HolographicPlayer;
