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

  if (!listing) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) {
      onRequireAuth();
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
            <h3>{listing.title}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ESC
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

              {currentUser ? (
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
