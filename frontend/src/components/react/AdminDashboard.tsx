import React, { useEffect, useState } from 'react';
import {
  deleteListingById,
  deleteUserById,
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

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);

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

  useEffect(() => {
    if (!userToDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteBusy) {
        setUserToDelete(null);
        setDeleteConfirmInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userToDelete, deleteBusy]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <section className="panel-card">
        <h2>Restricted Access — Administrator Role Required</h2>
        <p style={{ color: '#475569', fontSize: '13.5px' }}>
          This moderation console is restricted to authenticated institutional administrators (
          <code style={{ fontFamily: 'var(--font-mono)' }}>admin@ilmexchange.com</code>).
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

  const openDeleteUserModal = (targetUser: User) => {
    setError(null);
    setDeleteConfirmInput('');
    setUserToDelete(targetUser);
  };

  const closeDeleteUserModal = () => {
    if (deleteBusy) return;
    setUserToDelete(null);
    setDeleteConfirmInput('');
  };

  const isConfirmMatch =
    Boolean(userToDelete) &&
    (deleteConfirmInput === 'DELETE' ||
      deleteConfirmInput.trim() === userToDelete!.email);

  const handleConfirmDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userToDelete || !isConfirmMatch) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const targetId = userToDelete.id;
      await deleteUserById(token, targetId);
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
      setListings((prev) => prev.filter((item) => item.seller_id !== targetId));
      setUserToDelete(null);
      setDeleteConfirmInput('');
      onListingsChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user profile.');
    } finally {
      setDeleteBusy(false);
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
                  <th>MODERATION</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isProtectedAdmin =
                    u.role === 'ADMIN' ||
                    u.email.toLowerCase() === currentUser.email.toLowerCase();
                  return (
                    <tr key={u.id}>
                      <td className="mono-cell">#{u.id}</td>
                      <td>{u.name}</td>
                      <td className="mono-cell">{u.email}</td>
                      <td>
                        <span className="role-pill">{u.role}</span>
                      </td>
                      <td className="mono-cell">{u.created_at}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn-danger-outline ${
                            isProtectedAdmin ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isProtectedAdmin}
                          title={
                            isProtectedAdmin
                              ? 'Action denied: Admin accounts cannot be deleted.'
                              : 'Delete student profile'
                          }
                          style={
                            isProtectedAdmin
                              ? { opacity: 0.45, cursor: 'not-allowed' }
                              : undefined
                          }
                          onClick={() => {
                            if (!isProtectedAdmin) {
                              openDeleteUserModal(u);
                            }
                          }}
                        >
                          {isProtectedAdmin ? 'Admin Protected' : 'Delete Profile'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {userToDelete && (
        <div className="modal-backdrop" onClick={closeDeleteUserModal}>
          <div
            className="modal-card"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Confirm User Profile Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDeleteUserModal}
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
              <form onSubmit={handleConfirmDeleteUser}>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    color: '#334155',
                  }}
                >
                  Are you sure you want to delete the profile for{' '}
                  <strong>{userToDelete.name}</strong>? This will permanently remove their account, active listings, and message history.
                </p>

                <div className="form-field">
                  <label htmlFor="confirm-delete-user-input">
                    Type <strong>DELETE</strong> (or{' '}
                    <code style={{ fontFamily: 'var(--font-mono)' }}>{userToDelete.email}</code>) to confirm
                  </label>
                  <input
                    id="confirm-delete-user-input"
                    type="text"
                    className="form-input"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button
                    type="button"
                    className="category-chip"
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={closeDeleteUserModal}
                    disabled={deleteBusy}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn-danger-outline ${
                      !isConfirmMatch || deleteBusy ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!isConfirmMatch || deleteBusy}
                    style={{
                      flex: 1.4,
                      padding: '9px 14px',
                      backgroundColor: isConfirmMatch && !deleteBusy ? '#991B1B' : '#FEE2E2',
                      color: isConfirmMatch && !deleteBusy ? '#FFFFFF' : '#991B1B',
                      borderColor: '#FCA5A5',
                      opacity: !isConfirmMatch || deleteBusy ? 0.5 : 1,
                      cursor: !isConfirmMatch || deleteBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleteBusy ? 'Deleting User...' : 'Permanently Delete User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
