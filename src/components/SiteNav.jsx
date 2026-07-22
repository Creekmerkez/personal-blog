import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SiteNav.css';

const SiteNav = () => {
  const navRef = useRef(null);

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
        <Link to="/ceske-realie" className="site-subnav-link">České Reálie - Download</Link>
      </div>
    </nav>
  );
};

export default SiteNav;
