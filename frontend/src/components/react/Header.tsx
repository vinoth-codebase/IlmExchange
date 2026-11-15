import React, { useEffect, useRef } from 'react';
import { User } from '../../api';
import { SearchEventDetail } from '../lit/ilm-search-bar';
import '../lit/ilm-search-bar';

export type ActiveView = 'STOREFRONT' | 'USER_DASHBOARD' | 'ADMIN' | 'DOCS';

interface HeaderProps {
  favoritesCount: number;
  inboxCount: number;
  currentUser: User | null;
  activeView: ActiveView;
  searchQuery: string;
  selectedCategory: string;
  selectedCampus: string;
  onNavigate: (view: ActiveView) => void;
  onOpenFavorites: () => void;
  onOpenInbox: () => void;
  onOpenAdvertise: () => void;
  onAccountAction: () => void;
  onSearchChange: (detail: SearchEventDetail) => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount,
  inboxCount,
  currentUser,
  searchQuery,
  selectedCategory,
  selectedCampus,
  onNavigate,
  onOpenFavorites,
  onOpenInbox,
  onOpenAdvertise,
  onAccountAction,
  onSearchChange,
}) => {
  const searchBarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = searchBarRef.current;
    if (!node) return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<SearchEventDetail>;
      if (customEvent.detail) {
        onSearchChange(customEvent.detail);
      }
    };

    node.addEventListener('ilm-search', handler);
    return () => {
      node.removeEventListener('ilm-search', handler);
    };
  }, [onSearchChange]);

  useEffect(() => {
    const node = searchBarRef.current as any;
    if (!node) return;
    node.query = searchQuery;
    node.category = selectedCategory;
    node.campus = selectedCampus;
  }, [searchQuery, selectedCategory, selectedCampus]);

  return (
    <header className="site-header">
      <div className="header-top-bar">
        <button
          type="button"
          className="brand-button"
          onClick={() => onNavigate('STOREFRONT')}
        >
          <img
            src="/assets/Uni Logo.jpeg"
            alt="TU Ilmenau Logo"
            className="h-9 object-contain"
            style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
          <span className="brand-title-group">
            <span className="brand-university">IlmExchange</span>
            <span className="brand-subtitle">Peer to Peer student marketplace</span>
          </span>
        </button>

        <button
          type="button"
          className="favorites-trigger-btn"
          onClick={onOpenFavorites}
          aria-label="Open saved favorites drawer"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={favoritesCount > 0 ? '#0D9488' : 'none'}
            stroke="#0D9488"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Favoriten ({favoritesCount})</span>
        </button>
      </div>

      <div className="header-nav-bar">
        <div className="header-nav-inner">
          <div className="header-search-slot">
            {React.createElement('ilm-search-bar', {
              ref: searchBarRef,
              query: searchQuery,
              category: selectedCategory,
              campus: selectedCampus,
            })}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-advertise"
              onClick={onOpenAdvertise}
            >
              + Advertise
            </button>

            <button
              type="button"
              className="btn-account"
              onClick={onOpenInbox}
              aria-label="Open in-app messaging inbox"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Inbox ({inboxCount})</span>
            </button>

            {currentUser && (
              <button
                type="button"
                className="btn-account"
                onClick={() => onNavigate('USER_DASHBOARD')}
              >
                <span>My Ads</span>
              </button>
            )}

            <button
              type="button"
              className="btn-account"
              onClick={onAccountAction}
            >
              <span>My Account</span>
              {currentUser && (
                <span className="role-pill">{currentUser.role}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
