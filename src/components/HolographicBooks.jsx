import React, { useEffect, useState } from 'react';
import BooksSection from './BooksSection';
import books from './booksData';
import '../styles/HolographicGallery.css';

const HolographicBooks = ({ open, onClose, originRect }) => {
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
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [render]);

  useEffect(() => {
    if (!render) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [render, onClose]);

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
        className="holo-gallery-panel holo-books-panel"
        style={originStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Books gallery"
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

        <header className="holo-gallery-header holo-books-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">MY BOOKS</h2>
            <span className="holo-gallery-subtitle">Written Words</span>
          </div>

          <span className="holo-gallery-counter">
            {String(books.length).padStart(2, '0')} TITLES
          </span>
        </header>

        <div className="holo-books-scroll">
          <BooksSection showTitle={false} className="books-section-popup" />
        </div>
      </div>
    </div>
  );
};

export default HolographicBooks;