import React, { useEffect, useMemo, useState } from 'react';
import '../styles/HolographicGallery.css';
import photos from './photosData';

// Fixed collage slots — absolute positions (in %) that recreate the reference's
// overlapping, asymmetric floating layout. Each page fills these in order.
const SLOTS = [
  { left: 4, top: 6, w: 17, h: 44, z: 3 },
  { left: 24, top: 2, w: 23, h: 60, z: 4 },
  { left: 49, top: 6, w: 21, h: 38, z: 3 },
  { left: 72, top: 6, w: 19, h: 48, z: 3 },
  { left: 14, top: 40, w: 19, h: 32, z: 5 },
  { left: 40, top: 34, w: 21, h: 56, z: 7 },
  { left: 60, top: 42, w: 23, h: 34, z: 4 },
  { left: 3, top: 60, w: 23, h: 35, z: 4 },
  { left: 28, top: 56, w: 16, h: 40, z: 6 },
  { left: 45, top: 64, w: 16, h: 33, z: 5 },
  { left: 60, top: 66, w: 13, h: 28, z: 5 },
  { left: 73, top: 58, w: 19, h: 36, z: 4 },
];

const PAGE_SIZE = SLOTS.length;

const HolographicGallery = ({ open, onClose, originRect }) => {
  // `render` keeps the node mounted through the collapse animation;
  // `visible` drives the emerge / collapse transition.
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (render) {
      setVisible(false);
      const delay = window.innerWidth < 600 ? 0 : 520;
      const t = setTimeout(() => {
        setRender(false);
        setExpanded(null);
        setActiveFilter('All');
        setPage(0);
      }, delay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock background scroll while open.
  useEffect(() => {
    if (!render) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [render]);

  // Escape collapses the expanded photo first, then the whole gallery.
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

  const categories = useMemo(() => {
    const unique = Array.from(new Set(photos.map((p) => p.category).filter(Boolean)));
    return ['All', ...unique];
  }, []);

  const filtered = useMemo(
    () => (activeFilter === 'All' ? photos : photos.filter((p) => p.category === activeFilter)),
    [activeFilter]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagePhotos = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const selectFilter = (cat) => {
    setActiveFilter(cat);
    setPage(0);
  };

  const goPage = (dir) => {
    setPage((p) => (p + dir + pageCount) % pageCount);
  };

  if (!render) return null;

  // Emerge from the clicked card.
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const ox = originRect ? originRect.left + originRect.width / 2 : cx;
  const oy = originRect ? originRect.top + originRect.height / 2 : cy;
  const originStyle = { '--dx': `${ox - cx}px`, '--dy': `${oy - cy}px` };

  const shownEnd = safePage * PAGE_SIZE + pagePhotos.length;

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
        aria-label="Photo gallery"
      >
        {/* HUD corner brackets */}
        <span className="holo-corner tl" aria-hidden="true" />
        <span className="holo-corner tr" aria-hidden="true" />
        <span className="holo-corner bl" aria-hidden="true" />
        <span className="holo-corner br" aria-hidden="true" />

        {/* Side dot rails */}
        <div className="holo-rail left" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>
        <div className="holo-rail right" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>

        <header className="holo-gallery-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">MY PHOTOS</h2>
            <span className="holo-gallery-subtitle">Visual Stories</span>
          </div>

          <span className="holo-gallery-counter">
            {String(shownEnd).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}
          </span>

          {categories.length > 1 && (
            <nav className="holo-gallery-filters" aria-label="Filter photos">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`holo-filter ${activeFilter === cat ? 'active' : ''}`}
                  onClick={() => selectFilter(cat)}
                >
                  {cat === 'All' ? 'ALL' : cat}
                </button>
              ))}
              <span className="holo-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </nav>
          )}
        </header>

        <div className="holo-collage">
          {pagePhotos.map((p, i) => {
            const slot = SLOTS[i];
            return (
              <button
                key={p.id}
                type="button"
                className="holo-photo"
                style={{
                  left: `${slot.left}%`,
                  top: `${slot.top}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  zIndex: slot.z,
                }}
                onClick={() => setExpanded(p)}
                aria-label={`Expand ${p.alt}`}
              >
                <img src={p.src} alt={p.alt} loading="lazy" />
                <span className="holo-photo-sheen" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <footer className="holo-gallery-footer">
          <button
            type="button"
            className="holo-nav-arrow"
            onClick={() => goPage(-1)}
            disabled={pageCount <= 1}
            aria-label="Previous photos"
          >
            ←
          </button>
          <div className="holo-dots" role="tablist" aria-label="Gallery pages">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`holo-dot ${i === safePage ? 'active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-selected={i === safePage}
                role="tab"
              />
            ))}
          </div>
          <button
            type="button"
            className="holo-nav-arrow"
            onClick={() => goPage(1)}
            disabled={pageCount <= 1}
            aria-label="Next photos"
          >
            →
          </button>
        </footer>

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

export default HolographicGallery;
