import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

// The signature and the social icons used to sit in the top nav beside the
// brand name. The name is gone from there, and these moved down here with it,
// so the header is just the theme toggle and the České Reálie link.
const Footer = () => (
  <footer className="site-footer">
    <Link to="/" className="site-footer-signature" aria-label="Home">
      Yulia M..
    </Link>

    <div className="site-footer-socials">
      <a
        href="https://www.instagram.com/j.merkus/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="site-footer-social"
      >
        <svg className="site-footer-social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="7" r="0.9" fill="currentColor" />
        </svg>
      </a>
      <a
        href="https://www.linkedin.com/in/juliamerkusheva"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className="site-footer-social"
      >
        <span className="site-footer-linkedin" aria-hidden="true">in</span>
      </a>
    </div>

    <span className="site-footer-sep" aria-hidden="true">·</span>
    <a className="site-footer-link" href="mailto:julia.merkusheva@gmail.com">
      julia.merkusheva@gmail.com
    </a>
    <span className="site-footer-sep" aria-hidden="true">·</span>
    <Link className="site-footer-link" to="/privacy">
      Privacy
    </Link>
  </footer>
);

export default Footer;
