import React from 'react';
import { ActiveView } from './Header';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong>IlmExchange</strong> — Technische Universitat Ilmenau Student Initiative (Ehrenbergstrasse 29, 98693 Ilmenau)
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => onNavigate('STOREFRONT')}
          >
            Imprint
          </button>
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => onNavigate('STOREFRONT')}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => onNavigate('STOREFRONT')}
          >
            Terms
          </button>
          <button
            type="button"
            className="footer-link-btn footer-link-dev"
            onClick={() => onNavigate('DOCS')}
          >
            Developer API &amp; Design System
          </button>
        </nav>
      </div>
    </footer>
  );
};
