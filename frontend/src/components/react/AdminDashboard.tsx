import React, { useEffect, useState } from 'react';
import {
  deleteListingById,
  fetchAdminOverview,
  Listing,
  User,
} from '../../api';

interface AdminDashboardProps {
  token: string | null;
  currentUser: User | null;
  onListingsChanged: () => void;
  onReturnStorefront: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  currentUser,
  onListingsChanged,
  onReturnStorefront,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchAdminOverview(token);
      setUsers(overview.users);
      setListings(overview.listings);
    } catch (err: any) {
      setError(err.message || 'Unable to load administrator telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' && token) {
      loadOverview();
    } else {
      setLoading(false);
    }
  }, [currentUser, token]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <section className="panel-card">
        <h2>Restricted Access — Administrator Role Required</h2>
        <p style={{ color: '#475569', fontSize: '13.5px' }}>
          This moderation console is restricted to authenticated institutional administrators (
          <code style={{ fontFamily: 'var(--font-mono)' }}>vinothofficial14@gmail.com</code>).
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

  const handleDelete = async (listingId: number) => {
    if (!token) return;
    try {
      await deleteListingById(token, listingId);
      setListings((prev) => prev.filter((item) => item.id !== listingId));
      onListingsChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing.');
    }
  };

  return (
    <section aria-label="Administrator Moderation Console">
      <div className="section-header-bar">
        <div className="section-title-wrap">
          <h1 className="section-title">Admin Moderation Console</h1>
          <span className="section-telemetry">
            ROLE: ADMIN // {users.length} REGISTERED USERS // {listings.length} ACTIVE LISTINGS
          </span>
        </div>
        <button
          type="button"
          className="category-chip"
          onClick={onReturnStorefront}
        >
          Back to Storefront
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="panel-card">Loading moderation records...</div>
      ) : (
        <>
          <div className="panel-card">
            <h2 style={{ marginTop: 0, fontSize: '15px' }}>Active Marketplace Listings</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Pickup Location</th>
                  <th>Seller</th>
                  <th>Moderation</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id}>
                    <td className="mono-cell">#{item.id}</td>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td className="mono-cell">
                      EUR {Number(item.price).toFixed(0)} {item.price_type}
                    </td>
                    <td>{item.pickup_location}</td>
                    <td className="mono-cell">{item.seller_email || `User #${item.seller_id}`}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-card">
            <h2 style={{ marginTop: 0, fontSize: '15px' }}>Registered Campus Users</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="mono-cell">#{u.id}</td>
                    <td>{u.name}</td>
                    <td className="mono-cell">{u.email}</td>
                    <td>
                      <span className="role-pill">{u.role}</span>
                    </td>
                    <td className="mono-cell">{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
