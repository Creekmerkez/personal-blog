import { useEffect, useLayoutEffect, useRef } from 'react';
import { IoChevronBack } from 'react-icons/io5';

/** A screen with an iOS-style navigation bar and large title. */
export function Screen({ title, leading, trailing, onBack, backLabel, children }) {
  return (
    <section className="org-screen">
      <header className="org-navbar">
        <div className="org-navbar-side">
          {onBack ? (
            <button type="button" className="org-link org-back" onClick={onBack}>
              <IoChevronBack aria-hidden="true" /> {backLabel}
            </button>
          ) : (
            leading
          )}
        </div>
        <div className="org-navbar-side org-navbar-trailing">{trailing}</div>
      </header>
      <h1 className="org-large-title">{title}</h1>
      <div className="org-screen-body">{children}</div>
    </section>
  );
}

/** A bottom sheet with its own small navigation bar, like a SwiftUI sheet. */
let openSheets = 0;
let savedScrollY = 0;

/** Freezes the page behind open sheets. iOS Safari ignores overflow: hidden, so pin the body instead. */
function freezePage() {
  if (openSheets++ > 0) return;
  savedScrollY = window.scrollY;
  Object.assign(document.body.style, { position: 'fixed', top: `-${savedScrollY}px`, left: '0', right: '0' });
}

function unfreezePage() {
  if (--openSheets > 0) return;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '' });
  window.scrollTo(0, savedScrollY);
}

export function Sheet({ title, leading, trailing, onClose, children }) {
  const bodyRef = useRef(null);

  // Always open at the top: the title and name come first, not the details below.
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    freezePage();
    return unfreezePage;
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="org-sheet-backdrop" role="presentation">
      <div className="org-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="org-sheet-bar">
          <div className="org-navbar-side">{leading}</div>
          <strong className="org-sheet-title">{title}</strong>
          <div className="org-navbar-side org-navbar-trailing">{trailing}</div>
        </header>
        <div className="org-sheet-body" ref={bodyRef}>{children}</div>
      </div>
    </div>
  );
}

export function Section({ header, footer, children }) {
  return (
    <div className="org-section">
      {header && <h2 className="org-section-header">{header}</h2>}
      <div className="org-group">{children}</div>
      {footer && <p className="org-section-footer">{footer}</p>}
    </div>
  );
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="org-empty">
      <div className="org-empty-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="org-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? 'is-selected' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="org-row org-toggle-row">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function FlagDot({ flag }) {
  return <span className={`org-flag org-flag-${flag}`} aria-label={flag === 'red' ? 'Red' : 'Green'} />;
}
