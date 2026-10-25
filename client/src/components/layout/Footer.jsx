import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Navigation Categories */}
        <div className="footer-sections-grid">
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/">Help Centre</Link></li>
              <li><Link to="/">AirCover Protection</Link></li>
              <li><Link to="/">Anti-discrimination</Link></li>
              <li><Link to="/">Disability support</Link></li>
              <li><Link to="/">Cancellation options</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Hosting</h4>
            <ul>
              <li><Link to="/become-host">Airbnb your home</Link></li>
              <li><Link to="/become-host">AirCover for Hosts</Link></li>
              <li><Link to="/become-host">Hosting resources</Link></li>
              <li><Link to="/become-host">Community forum</Link></li>
              <li><Link to="/become-host">Host responsibly</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Airbnb</h4>
            <ul>
              <li><Link to="/">Newsroom</Link></li>
              <li><Link to="/">New features</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Investors</Link></li>
              <li><Link to="/">Emergency stays</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Controls */}
        <div className="footer-bottom-bar">
          <div className="footer-legal-wrap">
            <span>© {currentYear} Airbnb Clone, Inc.</span>
            <span className="footer-dot">·</span>
            <Link to="/">Privacy</Link>
            <span className="footer-dot">·</span>
            <Link to="/">Terms</Link>
            <span className="footer-dot">·</span>
            <Link to="/">Sitemap</Link>
            <span className="footer-dot">·</span>
            <Link to="/">Company details</Link>
          </div>

          <div className="footer-controls">
            <button type="button" className="footer-pref-btn">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 8 8 8.01 8.01 0 0 0-8-8zm5.93 7H9.95a12.7 12.7 0 0 0-1.12-5.06A6.96 6.96 0 0 1 13.93 7zM8 1.95c.57 1.34 1.11 3.2 1.25 5.05H6.75C6.89 5.15 7.43 3.29 8 1.95zM2.07 7a6.96 6.96 0 0 1 5.1-5.06A12.7 12.7 0 0 0 6.05 7H2.07zm0 2h3.98a12.7 12.7 0 0 0 1.12 5.06A6.96 6.96 0 0 1 2.07 9zm5.93 5.05c-.57-1.34-1.11-3.2-1.25-5.05h2.5c-.14 1.85-.68 3.71-1.25 5.05zM9.95 9h3.98a6.96 6.96 0 0 1-5.1 5.06A12.7 12.7 0 0 0 9.95 9z"/>
              </svg>
              <span>English (IN)</span>
            </button>

            <button type="button" className="footer-pref-btn">
              <span>₹ INR</span>
            </button>

            <div className="footer-social-links">
              {/* Facebook Icon */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z"/>
                </svg>
              </a>

              {/* Twitter / X Icon */}
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Instagram Icon */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

