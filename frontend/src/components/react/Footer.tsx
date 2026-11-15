import React, { useEffect, useState } from 'react';
import { ActiveView } from './Header';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [termsOpen, setTermsOpen] = useState<boolean>(false);
  const [imprintOpen, setImprintOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!termsOpen && !imprintOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTermsOpen(false);
        setImprintOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [termsOpen, imprintOpen]);

  return (
    <>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>IlmExchange</strong> — Technische Universitat Ilmenau Student Initiative (Ehrenbergstrasse 29, 98693 Ilmenau)
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setImprintOpen(true)}
            >
              Imprint
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setTermsOpen(true)}
            >
              Terms &amp; Policy
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

      {imprintOpen && (
        <div className="modal-backdrop" onClick={() => setImprintOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Imprint (Impressum)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setImprintOpen(false)}
                aria-label="Close modal"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                lineHeight: 1.55,
                fontSize: '13.5px',
                color: '#334155',
              }}
            >
              <div>
                <strong style={{ color: '#003a63' }}>Operator:</strong> Vinothkumar N.
              </div>
              <div>
                <strong style={{ color: '#003a63' }}>Status:</strong> M.Sc. Student, Technische Universität Ilmenau
              </div>
              <div>
                <strong style={{ color: '#003a63' }}>Contact:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>vinothofficial14@gmail.com</span>
              </div>
              <div
                style={{
                  marginTop: '4px',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  color: '#475569',
                }}
              >
                <strong style={{ color: '#003a63' }}>Disclaimer:</strong> This website is a non-commercial student portfolio project developed for demonstration purposes. It is not an officially affiliated service of TU Ilmenau.
              </div>
              <div style={{ paddingTop: '4px' }}>
                <button
                  type="button"
                  className="btn-primary-teal"
                  onClick={() => setImprintOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {termsOpen && (
        <div className="modal-backdrop" onClick={() => setTermsOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>IlmExchange Terms &amp; Liability Policy</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setTermsOpen(false)}
                aria-label="Close modal"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                lineHeight: 1.55,
                fontSize: '13.5px',
                color: '#334155',
              }}
            >
              <div>
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#003a63',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  General Disclaimer
                </h4>
                <p style={{ margin: 0 }}>
                  IlmExchange operates strictly as a peer-to-peer communication venue for university students. We do not own, inspect, or guarantee any items listed on this platform.
                </p>
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#003a63',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Buyer Liability
                </h4>
                <p style={{ margin: 0 }}>
                  Assumption of Risk: Buyers acquire items entirely at their own risk. IlmExchange is not liable for the condition, functionality, or safety of any products purchased. Buyers are strongly encouraged to inspect items thoroughly before finalizing any exchange.
                </p>
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#003a63',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Seller Responsibilities
                </h4>
                <p style={{ margin: 0 }}>
                  Accurate Representation: Sellers are solely responsible for providing accurate descriptions and photographs of their items. Sellers must ensure that items, especially electronics and mobility gear, are safe for use prior to listing.
                </p>
              </div>

              <div style={{ paddingTop: '4px' }}>
                <button
                  type="button"
                  className="btn-primary-teal"
                  onClick={() => setTermsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
