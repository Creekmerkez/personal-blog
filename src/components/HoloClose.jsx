import React from 'react';

// The × in a popup's header. On a phone the popups fill the screen, so there
// is no backdrop left to tap; this (and Escape) is how they close.
const HoloClose = ({ onClose, label = 'Close' }) => (
  <button type="button" className="holo-close" onClick={onClose} aria-label={label}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
);

export default HoloClose;
