import React, { useEffect, useRef, useState } from 'react';
import {
  fetchMessageSessions,
  Listing,
  MessageItem,
  sendMessageToSeller,
  User,
} from '../../api';
import '../lit/ilm-image-carousel';

interface AdCanvasModalProps {
  listing: Listing | null;
  currentUser: User | null;
  token: string | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onMessageSent?: () => void;
}

export const AdCanvasModal: React.FC<AdCanvasModalProps> = ({
  listing,
  currentUser,
  token,
  onClose,
  onRequireAuth,
  onMessageSent,
}) => {
  const carouselRef = useRef<HTMLElement | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number>(0);

  useEffect(() => {
    if (!listing) return;
    try {
      const storageKey = 'ilmexchange_listing_views';
      const raw = localStorage.getItem(storageKey);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      const key = String(listing.id);
      const baseViews = map[key] !== undefined ? Number(map[key]) : 11 + ((listing.id * 3) % 9);
      const nextViews = baseViews + 1;
      map[key] = nextViews;
      localStorage.setItem(storageKey, JSON.stringify(map));
      setViewCount(nextViews);
    } catch {
      setViewCount(14);
    }
  }, [listing]);

  useEffect(() => {
    if (!listing) return;
    const node = carouselRef.current as any;
    if (!node) return;
    node.images =
      listing.images && listing.images.length > 0 ? listing.images : [listing.image_url];
    node.activeIndex = 0;
    node.caption = listing.title;
  }, [listing]);

  useEffect(() => {
    if (!listing || !token) {
      setMessages([]);
      return;
    }
    let mounted = true;
    fetchMessageSessions(token)
      .then((res) => {
        if (!mounted) return;
        const thread = res.threads.find((t) => t.listing_id === listing.id);
        setMessages(thread ? thread.messages : []);
      })
      .catch(() => {
        if (mounted) setMessages([]);
      });
    return () => {
      mounted = false;
    };
  }, [listing, token]);

  useEffect(() => {
    if (!listing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing, onClose]);

  if (!listing) return null;

  const isOwnListing = Boolean(
    currentUser &&
      (listing.seller_id === currentUser.id ||
        (listing.seller_email &&
          listing.seller_email.toLowerCase() === currentUser.email.toLowerCase()))
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) {
      onRequireAuth();
      return;
    }
    if (isOwnListing) {
      setChatError('You cannot send a message to yourself on your own listing.');
      return;
    }
    if (!draftMessage.trim()) return;

    setSending(true);
    setChatError(null);
    try {
      const created = await sendMessageToSeller(token, {
        listing_id: listing.id,
        content: draftMessage.trim(),
      });
      setMessages((prev) => [...prev, created]);
      setDraftMessage('');
      onMessageSent?.();
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card ad-canvas-modal"
        style={{ maxWidth: '880px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                opacity: 0.85,
                display: 'block',
              }}
            >
              LISTING #{listing.id} // {listing.category.toUpperCase()} // STATUS: {listing.status}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3>{listing.title}</h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#F8FAFC',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
                aria-label="Listing view count"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{viewCount} Views</span>
              </span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
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

        <div className="modal-body ad-canvas-grid">
          <div className="ad-canvas-left">
            {React.createElement('ilm-image-carousel', {
              ref: carouselRef,
              caption: listing.title,
            })}

            <div className="ad-specs-strip">
              <div>
                <span className="spec-label">PRICE</span>
                <strong className="spec-value-mono">
                  EUR {Number(listing.price).toFixed(0)} ({listing.price_type})
                </strong>
              </div>
              <div>
                <span className="spec-label">CONDITION</span>
                <strong>{listing.condition}</strong>
              </div>
              <div>
                <span className="spec-label">PICKUP LOCATION</span>
                <strong>{listing.pickup_location}</strong>
              </div>
              <div>
                <span className="spec-label">STATUS</span>
                <span className={`status-tag status-${listing.status.toLowerCase()}`}>
                  {listing.status === 'AVAILABLE' ? 'READY TO BUY' : listing.status}
                </span>
              </div>
            </div>
          </div>

          <div className="ad-canvas-right">
            <div className="seller-profile-block">
              <div className="seller-block-header">VERIFIED CAMPUS SELLER PROFILE</div>
              <div className="seller-row">
                <span>Seller Name:</span>
                <strong>{listing.seller_name || 'TU Ilmenau Student'}</strong>
              </div>
              <div className="seller-row">
                <span>Contact Number:</span>
                <strong className="mono-cell">
                  {listing.seller_contact || '+49 152 08419201'}
                </strong>
              </div>
              <div className="seller-row">
                <span>Campus Email:</span>
                <span className="mono-cell">
                  {listing.seller_email || 'verified@tu-ilmenau.de'}
                </span>
              </div>
            </div>

            <div className="canvas-chat-panel">
              <div className="canvas-chat-header">
                <strong>Direct In-App Chat with Seller</strong>
                <span className="mono-cell" style={{ fontSize: '11px', color: '#64748B' }}>
                  {messages.length} msg(s)
                </span>
              </div>

              <div className="canvas-chat-messages">
                {messages.length === 0 ? (
                  <div className="canvas-chat-empty">
                    No messages yet on this listing. Ask about inspection time or campus pickup at{' '}
                    {listing.pickup_location}.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = currentUser && msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-bubble-meta">
                          <strong>{isMine ? 'You' : msg.sender_name || 'Seller'}</strong>
                          <span>{msg.created_at?.slice(11, 16) || 'Now'}</span>
                        </div>
                        <div className="chat-bubble-text">{msg.content}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {chatError && <div className="error-banner">{chatError}</div>}

              {isOwnListing ? (
                <div
                  className="status-banner"
                  style={{ marginBottom: 0, textAlign: 'center', fontSize: '12px' }}
                >
                  This is your own listing. Manage its status in <strong>My Ads</strong> or reply to buyer inquiries from your <strong>Inbox</strong>.
                </div>
              ) : currentUser ? (
                <form className="canvas-chat-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Message ${listing.seller_name || 'seller'} regarding pickup...`}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-advertise"
                    disabled={sending || !draftMessage.trim()}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn-primary-teal"
                  onClick={onRequireAuth}
                >
                  Sign In to Message Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
