import React, { useEffect, useState } from 'react';
import {
  fetchMessageSessions,
  markMessagesAsRead,
  MessageThread,
  sendMessageToSeller,
  User,
} from '../../api';

interface InboxDrawerProps {
  open: boolean;
  token: string | null;
  currentUser: User | null;
  onClose: () => void;
  onRequireAuth: () => void;
}

export const InboxDrawer: React.FC<InboxDrawerProps> = ({
  open,
  token,
  currentUser,
  onClose,
  onRequireAuth,
}) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeListingId, setActiveListingId] = useState<number | null>(null);
  const [readListingIds, setReadListingIds] = useState<Set<number>>(() => new Set());
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMessageSessions(token);
      setThreads(res.threads);
      if (res.threads.length > 0 && activeListingId === null) {
        setActiveListingId(res.threads[0].listing_id);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load message threads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      loadThreads();
    }
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeThread =
    threads.find((t) => t.listing_id === activeListingId) || threads[0] || null;

  const isThreadUnread = (thread: MessageThread): boolean => {
    if (readListingIds.has(thread.listing_id)) {
      return false;
    }
    if (typeof thread.unread_count === 'number') {
      return thread.unread_count > 0;
    }
    if (!currentUser) return false;
    return thread.messages.some(
      (msg) => msg.receiver_id === currentUser.id && !msg.is_read
    );
  };

  const handleSelectThread = (listingId: number) => {
    setActiveListingId(listingId);
    setReadListingIds((prev) => {
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
    setThreads((prev) =>
      prev.map((t) =>
        t.listing_id === listingId
          ? {
              ...t,
              unread_count: 0,
              messages: t.messages.map((m) => ({ ...m, is_read: 1 })),
            }
          : t
      )
    );
    if (token) {
      markMessagesAsRead(token, listingId);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeThread || !replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const sent = await sendMessageToSeller(token, {
        listing_id: activeThread.listing_id,
        receiver_id: activeThread.counterpart_id,
        content: replyText.trim(),
      });
      setThreads((prev) =>
        prev.map((thread) =>
          thread.listing_id === activeThread.listing_id
            ? { ...thread, unread_count: 0, messages: [...thread.messages, sent] }
            : thread
        )
      );
      setReplyText('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={onClose}>
      <aside
        className="inbox-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="In-App Messaging Inbox Drawer"
      >
        <div className="modal-header">
          <div>
            <h3>Campus Messaging Inbox ({threads.length})</h3>
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

        {!currentUser || !token ? (
          <div style={{ padding: '24px' }}>
            <div className="status-banner">
              Sign in with your TU Ilmenau or Gmail account to view and reply to buyer/seller
              messages.
            </div>
            <button
              type="button"
              className="btn-primary-teal"
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
            >
              Sign In to Open Inbox
            </button>
          </div>
        ) : (
          <div className="inbox-drawer-body">
            <div className="inbox-threads-list">
              {loading && threads.length === 0 ? (
                <div style={{ padding: '14px', fontSize: '12.5px', color: '#64748B' }}>
                  Loading conversations...
                </div>
              ) : threads.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '12.5px', color: '#64748B' }}>
                  No conversations yet. Click any listing on the storefront to message a seller.
                </div>
              ) : (
                threads.map((thread) => {
                  const isSelected = activeThread?.listing_id === thread.listing_id;
                  const unread = isThreadUnread(thread);
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  return (
                    <button
                      key={thread.listing_id}
                      type="button"
                      className={`inbox-thread-item ${isSelected ? 'active' : ''} ${
                        unread ? 'unread' : ''
                      }`}
                      style={
                        unread
                          ? {
                              backgroundColor: '#F0FDFA',
                              borderLeft: '3px solid #0D9488',
                              fontWeight: 700,
                            }
                          : undefined
                      }
                      onClick={() => handleSelectThread(thread.listing_id)}
                    >
                      <div
                        className="inbox-thread-title"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          fontWeight: unread ? 700 : 600,
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {thread.listing_title}
                        </span>
                        {unread && (
                          <span
                            aria-label="Unread messages"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#0D9488',
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </div>
                      <div
                        className="inbox-thread-sub"
                        style={{ fontWeight: unread ? 700 : 400 }}
                      >
                        With: <strong>{thread.counterpart_name}</strong> // EUR{' '}
                        {Number(thread.listing_price).toFixed(0)}
                      </div>
                      {lastMsg && (
                        <div
                          className="inbox-thread-preview"
                          style={{
                            fontWeight: unread ? 700 : 400,
                            color: unread ? '#0F172A' : undefined,
                          }}
                        >
                          {lastMsg.content}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {activeThread && (
              <div className="inbox-active-conversation">
                <div className="inbox-conv-header">
                  <div>
                    <strong>{activeThread.listing_title}</strong>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Seller: {activeThread.seller_name} ({activeThread.seller_contact}) //{' '}
                      {activeThread.listing_pickup_location}
                    </div>
                  </div>
                  <span
                    className={`status-tag status-${activeThread.listing_status.toLowerCase()}`}
                  >
                    {activeThread.listing_status}
                  </span>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="inbox-messages-scroll">
                  {activeThread.messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-bubble-meta">
                          <strong>{isMine ? 'You' : msg.sender_name || 'Student'}</strong>
                          <span>{msg.created_at?.slice(11, 16) || 'Now'}</span>
                        </div>
                        <div className="chat-bubble-text">{msg.content}</div>
                      </div>
                    );
                  })}
                </div>

                <form className="inbox-reply-form" onSubmit={handleReplySubmit}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Reply to ${activeThread.counterpart_name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-advertise"
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? '...' : 'Reply'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
