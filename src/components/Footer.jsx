import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => (
  <footer className="site-footer">
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
