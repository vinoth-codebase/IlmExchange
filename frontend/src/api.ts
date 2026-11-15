export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface User {
  id: number;
  email: string;
  name: string;
  contact_number: string;
  is_verified?: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at?: string;
}

export interface Listing {
  id: number;
  seller_id: number;
  title: string;
  price: number;
  price_type: 'FIXED' | 'VB';
  category: string;
  condition: string;
  pickup_location: string;
  image_url: string;
  status: ListingStatus;
  created_at: string;
  seller_name?: string;
  seller_email?: string;
  seller_contact?: string;
  images?: string[];
}

export interface MessageItem {
  id: number;
  listing_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read?: number;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  receiver_name?: string;
  receiver_email?: string;
  listing_title?: string;
}

export interface MessageThread {
  listing_id: number;
  listing_title: string;
  listing_price: number;
  listing_price_type: 'FIXED' | 'VB';
  listing_status: ListingStatus;
  listing_seller_id: number;
  listing_pickup_location: string;
  seller_name: string;
  seller_contact: string;
  counterpart_id: number;
  counterpart_name: string;
  unread_count?: number;
  messages: MessageItem[];
}

export interface AuthSessionResponse {
  token: string;
  user: User;
}

export interface CodeDispatchResponse {
  success: boolean;
  email: string;
  deliveredViaSmtp: boolean;
  message: string;
  demoCode?: string;
}

export interface AdminOverviewResponse {
  users: User[];
  listings: Listing[];
}

export const SALES_CATEGORIES = [
  'Bikes & Mobility',
  'Dorm & Furniture',
  'Kitchen & Appliances',
  'Electronics & Monitors',
  'Study & Textbooks',
  'Others',
] as const;

export const CAMPUS_LOCATIONS = [
  'City Center (Ilmenau Stadtmitte)',
  'Mensa Ehrenberg',
  'Haus A',
  'Haus C',
  'Haus D',
  'Haus E',
  'Haus H',
  'Haus I',
  'Haus K',
  'Haus L',
  'Haus N',
  'Haus P',
  'Haus Q',
  'Haus Zapf',
] as const;

const API_BASE = import.meta.env.VITE_API_URL || '';
const FALLBACK_API_BASE = 'http://localhost:3000';
export const FAVORITES_STORAGE_KEY = 'ilmexchange_favorites';
export const AUTH_TOKEN_STORAGE_KEY = 'ilmexchange_jwt';
export const AUTH_USER_STORAGE_KEY = 'ilmexchange_user';

async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const primaryUrl = `${API_BASE}${endpoint}`;
  try {
    return await fetch(primaryUrl, init);
  } catch {
    if (API_BASE !== FALLBACK_API_BASE) {
      return await fetch(`${FALLBACK_API_BASE}${endpoint}`, init);
    }
    throw new Error(
      'Cannot connect to IlmExchange backend on http://localhost:3000. Ensure ./start_app.sh is running.'
    );
  }
}

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}

export function getSavedFavorites(): Listing[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavorites(items: Listing[]): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent('ilm-favorites-updated', {
      detail: { favorites: items, count: items.length },
    })
  );
}

export function toggleFavoriteItem(listing: Listing): {
  favorites: Listing[];
  isFavorited: boolean;
} {
  const current = getSavedFavorites();
  const exists = current.some((item) => item.id === listing.id);
  const next = exists
    ? current.filter((item) => item.id !== listing.id)
    : [listing, ...current];
  saveFavorites(next);
  return { favorites: next, isFavorited: !exists };
}

export function removeFavoriteById(id: number): Listing[] {
  const current = getSavedFavorites();
  const next = current.filter((item) => item.id !== id);
  saveFavorites(next);
  return next;
}

// Listings API
export async function fetchListings(params?: {
  category?: string;
  campus?: string;
  q?: string;
  seller_id?: number;
}): Promise<Listing[]> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'ALL') {
    searchParams.set('category', params.category);
  }
  if (params?.campus && params.campus !== 'ALL') {
    searchParams.set('campus', params.campus);
  }
  if (params?.q) {
    searchParams.set('q', params.q);
  }
  if (params?.seller_id !== undefined) {
    searchParams.set('seller_id', String(params.seller_id));
  }
  const queryString = searchParams.toString();
  const endpoint = `/api/listings${queryString ? `?${queryString}` : ''}`;
  const response = await apiFetch(endpoint);
  if (!response.ok) {
    throw new Error('Failed to load marketplace listings.');
  }
  const data = (await response.json()) as Listing[];
  return data.map((item) => ({
    ...item,
    image_url: resolveMediaUrl(item.image_url),
    images: (item.images && item.images.length > 0 ? item.images : [item.image_url]).map(
      resolveMediaUrl
    ),
  }));
}

export async function publishListing(
  token: string,
  payload: {
    title: string;
    price: number;
    price_type: 'FIXED' | 'VB';
    category: string;
    condition: string;
    pickup_location: string;
    files?: File[];
  }
): Promise<Listing> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('price', String(payload.price));
  formData.append('price_type', payload.price_type);
  formData.append('category', payload.category);
  formData.append('condition', payload.condition);
  formData.append('pickup_location', payload.pickup_location);

  if (payload.files && payload.files.length > 0) {
    for (const file of payload.files.slice(0, 5)) {
      formData.append('images', file);
    }
  }

  const response = await apiFetch('/api/listings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish listing.');
  }
  return {
    ...data,
    image_url: resolveMediaUrl(data.image_url),
    images: (data.images || [data.image_url]).map(resolveMediaUrl),
  };
}

export async function updateListingStatus(
  token: string,
  listingId: number,
  status: ListingStatus
): Promise<Listing> {
  const response = await apiFetch(`/api/listings/${listingId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update listing status.');
  }
  return {
    ...data,
    image_url: resolveMediaUrl(data.image_url),
    images: (data.images || [data.image_url]).map(resolveMediaUrl),
  };
}

export async function deleteListingById(token: string, listingId: number): Promise<void> {
  const response = await apiFetch(`/api/listings/${listingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete listing.');
  }
}

// Auth API (Password + Verification Code Flow)
export async function registerUser(payload: {
  name: string;
  contact_number: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<CodeDispatchResponse> {
  const response = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed.');
  }
  return data;
}

export async function verifyEmailCode(payload: {
  email: string;
  code: string;
}): Promise<AuthSessionResponse> {
  const response = await apiFetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Email verification failed.');
  }
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthSessionResponse> {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const err: any = new Error(data.error || 'Login failed.');
    err.needsVerification = data.needsVerification;
    err.email = data.email;
    throw err;
  }
  return data;
}

export async function forgotPasswordRequest(email: string): Promise<CodeDispatchResponse> {
  const response = await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to request password reset code.');
  }
  return data;
}

export async function resetUserPassword(payload: {
  email: string;
  code: string;
  password: string;
  confirm_password: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await apiFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reset password.');
  }
  return data;
}

// Messaging API
export async function sendMessageToSeller(
  token: string,
  payload: {
    listing_id: number;
    content: string;
    receiver_id?: number;
  }
): Promise<MessageItem> {
  const response = await apiFetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send message.');
  }
  return data;
}

export async function fetchMessageSessions(
  token: string
): Promise<{ threads: MessageThread[] }> {
  const response = await apiFetch('/api/messages/session', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load messages.');
  }
  return data;
}

export async function markMessagesAsRead(
  token: string,
  listingId: number
): Promise<void> {
  await apiFetch('/api/messages/read', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ listing_id: listingId }),
  }).catch(() => {});
}

export async function fetchAdminOverview(token: string): Promise<AdminOverviewResponse> {
  const response = await apiFetch('/api/admin/overview', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch admin overview.');
  }
  return data;
}

export async function deleteUserById(token: string, userId: number): Promise<void> {
  const response = await apiFetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete user profile.');
  }
}
