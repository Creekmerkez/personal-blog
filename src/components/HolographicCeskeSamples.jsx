import React, { useEffect, useState } from 'react';
import '../styles/HolographicGallery.css';

const samplePages = [
  { id: 'page-2', src: '/images/2.jpg', alt: 'Ceske Realie sample page 2' },
  { id: 'page-3', src: '/images/3.jpg', alt: 'Ceske Realie sample page 3' },
  { id: 'page-4', src: '/images/4.jpg', alt: 'Ceske Realie sample page 4' },
  { id: 'page-5', src: '/images/5.jpg', alt: 'Ceske Realie sample page 5' },
  { id: 'page-6', src: '/images/6.jpg', alt: 'Ceske Realie sample page 6' },
  { id: 'page-7', src: '/images/7.jpg', alt: 'Ceske Realie sample page 7' },
];

const SLOTS = [
  { left: 5, top: 8, w: 28, h: 40, z: 3 },
  { left: 36, top: 8, w: 28, h: 40, z: 4 },
  { left: 67, top: 8, w: 28, h: 40, z: 3 },
  { left: 5, top: 52, w: 28, h: 40, z: 3 },
  { left: 36, top: 52, w: 28, h: 40, z: 4 },
  { left: 67, top: 52, w: 28, h: 40, z: 3 },
];

const HolographicCeskeSamples = ({ open, onClose, originRect }) => {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (render) {
      setVisible(false);
      // On mobile the 520ms closing-animation window keeps a GPU-promoted
      // panel in the DOM, which Android composites above carousel cards even
      // when the parent stage is opacity:0. Instant unmount removes it.
      const delay = window.innerWidth < 600 ? 0 : 520;
      const t = setTimeout(() => {
        setRender(false);
        setExpanded(null);
      }, delay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (expanded) setExpanded(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
        className="holo-gallery-panel"
        style={originStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ceske Realie sample pages"
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

        <header className="holo-gallery-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">CESKE REALIE</h2>
            <span className="holo-gallery-subtitle">Sample Pages 2 to 7</span>
          </div>

          <a
            className="holo-gallery-counter holo-filter-link"
            href="/ceske-realie"
            onClick={onClose}
          >
            BUY HERE
          </a>
        </header>

        <div className="holo-collage">
          {samplePages.map((page, index) => {
            const slot = SLOTS[index];
            return (
              <button
                key={page.id}
                type="button"
                className="holo-photo"
                style={{
                  left: `${slot.left}%`,
                  top: `${slot.top}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  zIndex: slot.z,
                }}
                onClick={() => setExpanded(page)}
                aria-label={`Expand ${page.alt}`}
              >
                <img src={page.src} alt={page.alt} loading="lazy" />
                <span className="holo-photo-sheen" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div className={`holo-lightbox ${expanded ? 'visible' : ''}`} onClick={() => setExpanded(null)}>
          {expanded && (
            <figure className="holo-lightbox-figure">
              <img src={expanded.src} alt={expanded.alt} />
              <figcaption className="holo-lightbox-caption">{expanded.alt}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolographicCeskeSamples;
