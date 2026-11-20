import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  CAMPUS_LOCATIONS,
  fetchListings,
  fetchMessageSessions,
  getSavedFavorites,
  Listing,
  publishListing,
  SALES_CATEGORIES,
  toggleFavoriteItem,
  User,
} from './api';
import { ActiveView, Header } from './components/react/Header';
import { Storefront } from './components/react/Storefront';
import { AdminDashboard } from './components/react/AdminDashboard';
import { UserDashboard } from './components/react/UserDashboard';
import { ComponentDocs } from './components/react/ComponentDocs';
import { Footer } from './components/react/Footer';
import { AuthModals } from './components/react/AuthModals';
import { AdCanvasModal } from './components/react/AdCanvasModal';
import { InboxDrawer } from './components/react/InboxDrawer';
import { SearchEventDetail } from './components/lit/ilm-search-bar';
import './components/lit/ilm-favorites-drawer';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('STOREFRONT');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<Listing[]>(() => getSavedFavorites());
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [inboxOpen, setInboxOpen] = useState<boolean>(false);
  const [inboxCount, setInboxCount] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialMessage, setAuthInitialMessage] = useState<string | null>(null);
  const [advertiseModalOpen, setAdvertiseModalOpen] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Advertise Form State (supports 1 to 5 images)
  const [adTitle, setAdTitle] = useState<string>('');
  const [adPrice, setAdPrice] = useState<string>('25');
  const [adPriceType, setAdPriceType] = useState<'FIXED' | 'VB'>('VB');
  const [adCategory, setAdCategory] = useState<string>(SALES_CATEGORIES[0]);
  const [adCondition, setAdCondition] = useState<string>('Very Good');
  const [adLocation, setAdLocation] = useState<string>(CAMPUS_LOCATIONS[2]);
  const [adFiles, setAdFiles] = useState<File[]>([]);
  const [adError, setAdError] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState<boolean>(false);

  const drawerRef = useRef<HTMLElement | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchListings({
        category: selectedCategory,
        campus: selectedCampus,
        q: searchQuery,
      });
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCampus, searchQuery]);

  const loadInboxCount = useCallback(async () => {
    if (!token) {
      setInboxCount(0);
      return;
    }
    try {
      const res = await fetchMessageSessions(token);
      setInboxCount(res.threads.length);
    } catch {
      setInboxCount(0);
    }
  }, [token]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    loadInboxCount();
  }, [loadInboxCount]);

  useEffect(() => {
    const syncFavs = () => {
      setFavorites(getSavedFavorites());
    };
    window.addEventListener('ilm-favorites-updated', syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      window.removeEventListener('ilm-favorites-updated', syncFavs);
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  useEffect(() => {
    const node = drawerRef.current as any;
    if (!node) return;
    node.open = drawerOpen;
    const handleClose = () => setDrawerOpen(false);
    node.addEventListener('ilm-drawer-close', handleClose);
    return () => {
      node.removeEventListener('ilm-drawer-close', handleClose);
    };
  }, [drawerOpen]);

  const handleSearchChange = useCallback((detail: SearchEventDetail) => {
    setSearchQuery(detail.query);
    setSelectedCategory(detail.category);
    setSelectedCampus(detail.campus);
    setActiveView('STOREFRONT');
  }, []);

  const handleToggleFavorite = useCallback((listing: Listing) => {
    const updated = toggleFavoriteItem(listing);
    setFavorites(updated.favorites);
  }, []);

  const handleOpenAdvertise = () => {
    if (!currentUser || !token) {
      setAuthInitialMessage('Please sign in or register to publish a campus listing.');
      setAuthModalOpen(true);
      return;
    }
    setAdError(null);
    setAdvertiseModalOpen(true);
  };

  const handleAccountAction = () => {
    setAuthInitialMessage(null);
    setAuthModalOpen(true);
  };

  const handleAuthenticated = (newToken: string, user: User) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  };

  const handleSignOut = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setAuthModalOpen(false);
    if (activeView === 'ADMIN' || activeView === 'USER_DASHBOARD') {
      setActiveView('STOREFRONT');
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    if (fileList.length > 5) {
      setAdError('Maximum 5 images allowed per listing. Selected first 5 files.');
    } else {
      setAdError(null);
    }
    setAdFiles(fileList.slice(0, 5));
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdError(null);
    setAdBusy(true);
    try {
      await publishListing(token, {
        title: adTitle,
        price: Number(adPrice),
        price_type: adPriceType,
        category: adCategory,
        condition: adCondition,
        pickup_location: adLocation,
        files: adFiles,
      });
      setAdTitle('');
      setAdPrice('25');
      setAdFiles([]);
      setAdvertiseModalOpen(false);
      setActiveView('STOREFRONT');
      await loadListings();
    } catch (err: any) {
      setAdError(err.message || 'Failed to publish listing.');
    } finally {
      setAdBusy(false);
    }
  };

  useEffect(() => {
    if (!advertiseModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdvertiseModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advertiseModalOpen]);

  return (
    <div className="app-shell">
      <Header
        favoritesCount={favorites.length}
        inboxCount={inboxCount}
        currentUser={currentUser}
        activeView={activeView}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedCampus={selectedCampus}
        onNavigate={setActiveView}
        onOpenFavorites={() => setDrawerOpen(true)}
        onOpenInbox={() => setInboxOpen(true)}
        onOpenAdvertise={handleOpenAdvertise}
        onAccountAction={handleAccountAction}
        onSearchChange={handleSearchChange}
      />

      <main className="main-container">
        {activeView === 'STOREFRONT' && (
          <Storefront
            listings={listings}
            favorites={favorites}
            currentUser={currentUser}
            selectedCategory={selectedCategory}
            loading={loading}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onToggleFavorite={handleToggleFavorite}
            onSelectListing={(listing) => setSelectedListing(listing)}
          />
        )}

        {activeView === 'USER_DASHBOARD' && (
          <UserDashboard
            token={token}
            currentUser={currentUser}
            listings={listings}
            onListingsChanged={loadListings}
            onOpenAdvertise={handleOpenAdvertise}
            onReturnStorefront={() => setActiveView('STOREFRONT')}
          />
        )}

        {activeView === 'ADMIN' && (
          <AdminDashboard
            token={token}
            currentUser={currentUser}
            onListingsChanged={loadListings}
            onReturnStorefront={() => setActiveView('STOREFRONT')}
          />
        )}

        {activeView === 'DOCS' && (
          <ComponentDocs onReturnStorefront={() => setActiveView('STOREFRONT')} />
        )}
      </main>

      {React.createElement('ilm-favorites-drawer', {
        ref: drawerRef,
        open: drawerOpen ? '' : undefined,
      })}

      <InboxDrawer
        open={inboxOpen}
        token={token}
        currentUser={currentUser}
        onClose={() => setInboxOpen(false)}
        onRequireAuth={() => setAuthModalOpen(true)}
      />

      <AdCanvasModal
        listing={selectedListing}
        currentUser={currentUser}
        token={token}
        onClose={() => setSelectedListing(null)}
        onRequireAuth={() => {
          setSelectedListing(null);
          setAuthModalOpen(true);
        }}
        onMessageSent={loadInboxCount}
      />

      <AuthModals
        open={authModalOpen}
        currentUser={currentUser}
        initialMessage={authInitialMessage}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        onOpenUserDashboard={() => setActiveView('USER_DASHBOARD')}
        onOpenAdminDashboard={() => setActiveView('ADMIN')}
        onSignOut={handleSignOut}
      />

      {advertiseModalOpen && (
        <div className="modal-backdrop" onClick={() => setAdvertiseModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Publish Campus Listing (1–5 Photos)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAdvertiseModalOpen(false)}
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
            <div className="modal-body">
              <form onSubmit={handlePublishListing}>
                {adError && <div className="error-banner">{adError}</div>}
                <div className="form-field">
                  <label htmlFor="ad-title">Item Title</label>
                  <input
                    id="ad-title"
                    required
                    className="form-input"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="e.g., Logitech MX Master 3S Mouse"
                  />
                </div>
                <div className="form-row-2col">
                  <div className="form-field">
                    <label htmlFor="ad-price">Price (EUR)</label>
                    <input
                      id="ad-price"
                      type="number"
                      min="0"
                      required
                      className="form-input"
                      value={adPrice}
                      onChange={(e) => setAdPrice(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ad-price-type">Pricing Term</label>
                    <select
                      id="ad-price-type"
                      className="form-select"
                      value={adPriceType}
                      onChange={(e) => setAdPriceType(e.target.value as 'FIXED' | 'VB')}
                    >
                      <option value="VB">VB (Negotiable)</option>
                      <option value="FIXED">FIXED</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-2col">
                  <div className="form-field">
                    <label htmlFor="ad-category">Category</label>
                    <select
                      id="ad-category"
                      className="form-select"
                      value={adCategory}
                      onChange={(e) => setAdCategory(e.target.value)}
                    >
                      {SALES_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="ad-condition">Condition</label>
                    <select
                      id="ad-condition"
                      className="form-select"
                      value={adCondition}
                      onChange={(e) => setAdCondition(e.target.value)}
                    >
                      <option value="Like New">Like New</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="ad-location">TU Ilmenau Pickup Location</label>
                  <select
                    id="ad-location"
                    className="form-select"
                    value={adLocation}
                    onChange={(e) => setAdLocation(e.target.value)}
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="ad-images">
                    Upload Item Photos (1 to 5 images, auto-deleted after 30 days)
                  </label>
                  <input
                    id="ad-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-input"
                    onChange={handleFilesSelected}
                  />
                  {adFiles.length > 0 && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: '#0D9488',
                      }}
                    >
                      Selected {adFiles.length} image(s):{' '}
                      {adFiles.map((f) => f.name).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-primary-teal"
                  disabled={adBusy}
                >
                  {adBusy ? 'Uploading & Publishing...' : 'Publish to Storefront'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={setActiveView} />
    </div>
  );
};

export default App;
