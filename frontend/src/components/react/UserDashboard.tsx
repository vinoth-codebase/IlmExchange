import React, { useState } from 'react';
import {
  deleteListingById,
  Listing,
  ListingStatus,
  updateListingStatus,
  User,
} from '../../api';

interface UserDashboardProps {
  token: string | null;
  currentUser: User | null;
  listings: Listing[];
  onListingsChanged: () => void;
  onOpenAdvertise: () => void;
  onReturnStorefront: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  token,
  currentUser,
  listings,
  onListingsChanged,
  onOpenAdvertise,
  onReturnStorefront,
}) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!currentUser || !token) {
    return (
      <section className="panel-card">
        <h2>Authentication Required</h2>
        <p style={{ color: '#475569', fontSize: '13.5px' }}>
          Please sign in to manage your published campus ads and update their lifecycle status.
        </p>
        <button
          type="button"
          className="btn-advertise"
          onClick={onReturnStorefront}
        >
          Return to Storefront
        </button>
      </section>
    );
  }

  const myListings = listings.filter((item) => item.seller_id === currentUser.id);

  const handleStatusChange = async (listingId: number, nextStatus: ListingStatus) => {
    setUpdatingId(listingId);
    setError(null);
    setFeedback(null);
    try {
      await updateListingStatus(token, listingId, nextStatus);
      const label =
        nextStatus === 'AVAILABLE'
          ? 'Ready to Buy (AVAILABLE)'
          : nextStatus === 'RESERVED'
          ? 'Reserved (RESERVED)'
          : 'Sold (SOLD)';
      setFeedback(`Updated Listing #${listingId} status to ${label}.`);
      onListingsChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to update listing status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (listingId: number) => {
    setError(null);
    try {
      await deleteListingById(token, listingId);
      setFeedback(`Deleted Listing #${listingId}.`);
      onListingsChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing.');
    }
  };

  return (
    <section aria-label="User Ad Lifecycle Dashboard">
      <div className="section-header-bar">
        <div className="section-title-wrap">
          <h1 className="section-title">My Ads &amp; Lifecycle Management</h1>
          <span className="section-telemetry">
            SELLER: {currentUser.name.toUpperCase()} ({currentUser.contact_number}) //{' '}
            {myListings.length} ACTIVE ADS (30-DAY AUTO-EXPIRY)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-advertise"
            onClick={onOpenAdvertise}
          >
            + Publish New Ad
          </button>
          <button
            type="button"
            className="category-chip"
            onClick={onReturnStorefront}
          >
            Back to Storefront
          </button>
        </div>
      </div>

      {feedback && <div className="status-banner">{feedback}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="panel-card">
        {myListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px', color: '#64748B' }}>
            You have not published any campus ads yet. Click <strong>+ Publish New Ad</strong> to
            upload 1–5 photos and list an item.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Title</th>
                <th>Price</th>
                <th>Photos</th>
                <th>Pickup Location</th>
                <th>LIFECYCLE STATUS</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myListings.map((item) => (
                <tr key={item.id}>
                  <td className="mono-cell">#{item.id}</td>
                  <td>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{item.category}</div>
                  </td>
                  <td className="mono-cell">
                    EUR {Number(item.price).toFixed(0)} {item.price_type}
                  </td>
                  <td className="mono-cell">{(item.images || [item.image_url]).length} / 5</td>
                  <td>{item.pickup_location}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        aria-label={`Change status for ${item.title}`}
                        className="form-select"
                        style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
                        value={item.status || 'AVAILABLE'}
                        disabled={updatingId === item.id}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as ListingStatus)
                        }
                      >
                        <option value="AVAILABLE">Ready to Buy (AVAILABLE)</option>
                        <option value="RESERVED">Reserved (RESERVED)</option>
                        <option value="SOLD">Sold (SOLD)</option>
                      </select>
                      <span
                        className={`status-tag status-${(
                          item.status || 'AVAILABLE'
                        ).toLowerCase()}`}
                      >
                        {item.status === 'AVAILABLE' ? 'READY TO BUY' : item.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove Ad
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
