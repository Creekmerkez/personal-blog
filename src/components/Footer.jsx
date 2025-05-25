import React from 'react';
import '../styles/Footer.css';

const Footer = () => (
  <div className="footer-container">
    <div className="footer-question">Do you want to work together?</div>
    <a
      href="https://www.linkedin.com/in/juliamerkusheva"
      target="_blank"
      rel="noopener noreferrer"
      className="main-linkedin-btn"
      aria-label="LinkedIn"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 34 34" style={{ marginRight: '0.7rem', display: 'inline-block' }}>
        <g>
          <rect className="background" fill="#0077B5" x="0" y="0" width="34" height="34" rx="6" />
          <path d="M26 25v-6.2c0-3.1-1.7-4.5-4-4.5-1.8 0-2.6 1-3 1.7V15h-3.5c0 .6 0 10 0 10H19v-5.6c0-.3 0-.6.1-.8.2-.6.7-1.3 1.6-1.3 1.1 0 1.5.9 1.5 2.2V25H26zM11 12.5c1.1 0 1.8-.7 1.8-1.6-.1-.9-.7-1.6-1.8-1.6s-1.8.7-1.8 1.6c0 .9.7 1.6 1.8 1.6zM12.8 25V15H9.2v10h3.6z" fill="#fff"/>
        </g>
      </svg>
      <span className="linkedin-text">LinkedIn</span>
    </a>
  </div>
);

export default Footer; 