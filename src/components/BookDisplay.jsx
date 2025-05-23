import React, { useState } from 'react';
import '../styles/BooksSection.css';

const MAX_LENGTH = 320; // Adjust as needed for truncation

const BookDisplay = ({ book }) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const isLong = book.description.length > MAX_LENGTH;
  const shortDesc = isLong ? book.description.slice(0, MAX_LENGTH) + '...' : book.description;

  // Modal image logic
  const mainImage = showBack ? book.backCoverImage : book.coverImage;
  const mainAlt = showBack ? `Back cover of ${book.title}` : `Cover of ${book.title}`;

  return (
    <>
      <div className="book-display">
        <div className="book-image-container">
          <img
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            className="book-cover"
            style={{ cursor: 'pointer' }}
            onClick={() => { setModalOpen(true); setShowBack(false); }}
          />
        </div>
        <div className="book-info">
          <h3 className="book-title">
            <a
              href={book.amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="book-title-link"
            >
              {book.title}
              {book.subtitle && (
                <span className="book-subtitle">{book.subtitle}</span>
              )}
            </a>
          </h3>
          <p className="book-description">
            {expanded || !isLong ? book.description : shortDesc}
            {isLong && (
              <button
                className="read-more-button"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </p>
        </div>
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            <button
              className="modal-arrow modal-arrow-left"
              onClick={() => setShowBack(false)}
              disabled={!showBack}
              aria-label="Show cover"
            >&#8592;</button>
            <img
              src={mainImage}
              alt={mainAlt}
              className="modal-image"
            />
            <button
              className="modal-arrow modal-arrow-right"
              onClick={() => setShowBack(true)}
              disabled={showBack}
              aria-label="Show back cover"
            >&#8594;</button>
            <div className="modal-thumbnails">
              <img
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className={`modal-thumb ${!showBack ? 'active' : ''}`}
                onClick={() => setShowBack(false)}
              />
              <img
                src={book.backCoverImage}
                alt={`Back cover of ${book.title}`}
                className={`modal-thumb ${showBack ? 'active' : ''}`}
                onClick={() => setShowBack(true)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookDisplay; 