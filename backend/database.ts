import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbFile = process.env.DB_PATH || path.join(__dirname, 'ilmexchange.db');
export const db = new Database(dbFile);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type AuthCodeType = 'REGISTER' | 'RESET';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  contact_number: string;
  is_verified: number;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

export interface PublicUserRecord {
  id: number;
  email: string;
  name: string;
  contact_number: string;
  is_verified: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

export interface AuthCodeRecord {
  email: string;
  code: string;
  type: AuthCodeType;
  expires_at: string;
}

export interface ListingImageRecord {
  id: number;
  listing_id: number;
  image_url: string;
}

export interface ListingRecord {
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

export interface MessageRecord {
  id: number;
  listing_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  receiver_name?: string;
  receiver_email?: string;
  listing_title?: string;
}

function hasColumn(tableName: string, columnName: string): boolean {
  const columns = db.pragma(`table_info(${tableName})`) as Array<{ name: string }>;
  return columns.some((col) => col.name === columnName);
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      contact_number TEXT NOT NULL DEFAULT '+49 3677 69-0',
      is_verified INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'STUDENT')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_codes (
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('REGISTER', 'RESET')),
      expires_at TEXT NOT NULL,
      PRIMARY KEY (email, type)
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      price_type TEXT NOT NULL CHECK(price_type IN ('FIXED', 'VB')),
      category TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'Very Good',
      pickup_location TEXT NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RESERVED', 'SOLD')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Apply non-destructive schema migrations for existing SQLite databases
  if (!hasColumn('users', 'password_hash')) {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`);
  }
  if (!hasColumn('users', 'contact_number')) {
    db.exec(`ALTER TABLE users ADD COLUMN contact_number TEXT NOT NULL DEFAULT '+49 3677 69-0'`);
  }
  if (!hasColumn('users', 'is_verified')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1`);
  }
  if (!hasColumn('listings', 'status')) {
    db.exec(
      `ALTER TABLE listings ADD COLUMN status TEXT NOT NULL DEFAULT 'AVAILABLE'`
    );
  }
}

export function toPublicUser(user: UserRecord): PublicUserRecord {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    contact_number: user.contact_number,
    is_verified: Boolean(user.is_verified),
    role: user.role,
    created_at: user.created_at,
  };
}
