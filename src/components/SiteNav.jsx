import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyTheme, getCurrentTheme } from '../theme';
import '../styles/SiteNav.css';

const SiteNav = () => {
  const navRef = useRef(null);
  const [theme, setTheme] = useState(getCurrentTheme);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  // The nav's height isn't fixed — the subnav link text wraps to 2-3 lines on
  // narrow viewports or when the OS font scale is increased, so pages that
  // reserve space for it via a static padding-top get overlapped. Measuring
  // the real rendered height keeps content clear of the nav in every case.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;

    const setHeightVar = () => {
      document.documentElement.style.setProperty('--site-nav-height', `${el.offsetHeight}px`);
    };

    setHeightVar();
    const observer = new ResizeObserver(setHeightVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="site-nav" ref={navRef} aria-label="Primary navigation">
      <div className="site-brand">
        <div className="brand-name-row">
          <Link to="/" className="brand-name">Yuliia Merkusheva</Link>
          <div className="brand-signature" aria-hidden="true">Yulia M..</div>
        </div>
        <div className="brand-socials">
          <a href="https://www.instagram.com/j.merkus/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="brand-social-link">
            <svg className="brand-social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="17" cy="7" r="0.9" fill="currentColor" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/juliamerkusheva" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="brand-social-link">
            <span className="brand-social-linkedin" aria-hidden="true">in</span>
          </a>
        </div>
      </div>
      <div className="site-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <Link to="/ceske-realie" className="site-subnav-link">České Reálie - Download</Link>
      </div>
    </nav>
  );
};

export default SiteNav;
