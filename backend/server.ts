import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  db,
  initializeDatabase,
  ListingRecord,
  ListingStatus,
  MessageRecord,
  toPublicUser,
  UserRecord,
} from './database';
import { authRouter, requireAuth, requireAdmin, AuthenticatedRequest } from './auth';
import { seedDatabase } from './seed';
import { removeUploadedFileIfPresent, startCleanupCronJob } from './cleanup_cron';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 8 * 1024 * 1024,
  },
});

initializeDatabase();
seedDatabase();
startCleanupCronJob();

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not permitted by IlmExchange CORS policy.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

function attachImagesToListings(listings: ListingRecord[]): ListingRecord[] {
  const getImagesStmt = db.prepare(
    'SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY id ASC'
  );
  return listings.map((listing) => {
    const rows = getImagesStmt.all(listing.id) as Array<{ image_url: string }>;
    const images = rows.length > 0 ? rows.map((r) => r.image_url) : [listing.image_url];
    return {
      ...listing,
      status: (listing.status || 'AVAILABLE') as ListingStatus,
      images,
    };
  });
}

app.get('/api/health', (_req: Request, res: Response) => {
  const listingCount = (
    db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }
  ).count;
  const userCount = (
    db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  ).count;
  const messageCount = (
    db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
  ).count;

  res.json({
    status: 'ok',
    service: 'ilmexchange-backend',
    listings: listingCount,
    users: userCount,
    messages: messageCount,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);

// GET /api/listings
app.get('/api/listings', (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const campus = typeof req.query.campus === 'string' ? req.query.campus.trim() : '';
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sellerId = req.query.seller_id ? Number(req.query.seller_id) : undefined;

    let sql = `
      SELECT
        l.id,
        l.seller_id,
        l.title,
        l.price,
        l.price_type,
        l.category,
        l.condition,
        l.pickup_location,
        l.image_url,
        l.status,
        l.created_at,
        u.name as seller_name,
        u.email as seller_email,
        u.contact_number as seller_contact
      FROM listings l
      LEFT JOIN users u ON l.seller_id = u.id
      WHERE 1 = 1
    `;
    const params: Array<string | number> = [];

    if (category && category !== 'ALL') {
      sql += ' AND l.category = ?';
      params.push(category);
    }

    if (campus && campus !== 'ALL') {
      sql += ' AND l.pickup_location LIKE ?';
      params.push(`%${campus}%`);
    }

    if (search) {
      sql += ' AND (l.title LIKE ? OR l.pickup_location LIKE ? OR l.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sellerId !== undefined && !Number.isNaN(sellerId)) {
      sql += ' AND l.seller_id = ?';
      params.push(sellerId);
    }

    sql += ' ORDER BY l.id ASC';

    const rawListings = db.prepare(sql).all(...params) as ListingRecord[];
    res.json(attachImagesToListings(rawListings));
  } catch (error) {
    console.error('[Server] Failed to fetch listings:', error);
    res.status(500).json({ error: 'Failed to retrieve marketplace listings.' });
  }
});

// POST /api/listings (accepts multipart/form-data with 1 to 5 images OR JSON payload)
app.post(
  '/api/listings',
  requireAuth,
  upload.array('images', 5),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        price,
        price_type,
        category,
        condition,
        pickup_location,
        image_url,
        image_urls,
      } = req.body || {};

      if (!title || price === undefined || !price_type || !category || !pickup_location) {
        res.status(400).json({
          error: 'Fields title, price, price_type, category, and pickup_location are required.',
        });
        return;
      }

      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        res.status(400).json({ error: 'Price must be a valid non-negative number.' });
        return;
      }

      const normalizedPriceType: 'FIXED' | 'VB' = price_type === 'VB' ? 'VB' : 'FIXED';
      const normalizedCondition =
        typeof condition === 'string' && condition.trim().length > 0
          ? condition.trim()
          : 'Very Good';

      const uploadedFiles = (req.files as Express.Multer.File[] | undefined) || [];
      const collectedImageUrls: string[] = [];

      for (const file of uploadedFiles.slice(0, 5)) {
        collectedImageUrls.push(`/uploads/${file.filename}`);
      }

      if (collectedImageUrls.length === 0 && Array.isArray(image_urls)) {
        for (const u of image_urls.slice(0, 5)) {
          if (typeof u === 'string' && u.trim().length > 0) {
            collectedImageUrls.push(u.trim());
          }
        }
      }

      if (
        collectedImageUrls.length === 0 &&
        typeof image_url === 'string' &&
        image_url.trim().length > 0
      ) {
        collectedImageUrls.push(image_url.trim());
      }

      if (collectedImageUrls.length === 0) {
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E2E8F0"/><rect x="40" y="40" width="720" height="520" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/><text x="400" y="290" text-anchor="middle" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="#003a63">${String(title).replace(/[<>&"']/g, '')}</text><text x="400" y="330" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" fill="#0D9488">${String(pickup_location).replace(/[<>&"']/g, '')}</text></svg>`;
        collectedImageUrls.push(`data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`);
      }

      const primaryImage = collectedImageUrls[0];

      const createTx = db.transaction(() => {
        const result = db
          .prepare(`
            INSERT INTO listings (
              seller_id,
              title,
              price,
              price_type,
              category,
              condition,
              pickup_location,
              image_url,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
          `)
          .run(
            req.user!.id,
            String(title).trim(),
            numericPrice,
            normalizedPriceType,
            String(category).trim(),
            normalizedCondition,
            String(pickup_location).trim(),
            primaryImage
          );

        const listingId = Number(result.lastInsertRowid);
        const insertImg = db.prepare(
          'INSERT INTO listing_images (listing_id, image_url) VALUES (?, ?)'
        );
        for (const imgUrl of collectedImageUrls) {
          insertImg.run(listingId, imgUrl);
        }
        return listingId;
      });

      const createdId = createTx();

      const created = db
        .prepare(`
          SELECT
            l.*,
            u.name as seller_name,
            u.email as seller_email,
            u.contact_number as seller_contact
          FROM listings l
          LEFT JOIN users u ON l.seller_id = u.id
          WHERE l.id = ?
        `)
        .get(createdId) as ListingRecord;

      res.status(201).json(attachImagesToListings([created])[0]);
    } catch (error) {
      console.error('[Server] Failed to create listing:', error);
      res.status(500).json({ error: 'Failed to publish listing.' });
    }
  }
);

// PATCH /api/listings/:id/status (Seller or ADMIN can update ad lifecycle status)
app.patch(
  '/api/listings/:id/status',
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const listingId = Number(req.params.id);
      const rawStatus =
        typeof req.body?.status === 'string' ? req.body.status.trim().toUpperCase() : '';

      if (Number.isNaN(listingId)) {
        res.status(400).json({ error: 'Invalid listing ID.' });
        return;
      }

      if (!['AVAILABLE', 'RESERVED', 'SOLD'].includes(rawStatus)) {
        res.status(400).json({
          error: 'Status must be one of AVAILABLE, RESERVED, or SOLD.',
        });
        return;
      }

      const existing = db
        .prepare('SELECT id, seller_id FROM listings WHERE id = ?')
        .get(listingId) as { id: number; seller_id: number } | undefined;

      if (!existing) {
        res.status(404).json({ error: 'Listing not found.' });
        return;
      }

      if (existing.seller_id !== req.user!.id && req.user!.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Only the seller of this listing or an administrator can update its status.',
        });
        return;
      }

      db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(rawStatus, listingId);

      const updated = db
        .prepare(`
          SELECT
            l.*,
            u.name as seller_name,
            u.email as seller_email,
            u.contact_number as seller_contact
          FROM listings l
          LEFT JOIN users u ON l.seller_id = u.id
          WHERE l.id = ?
        `)
        .get(listingId) as ListingRecord;

      res.json(attachImagesToListings([updated])[0]);
    } catch (error) {
      console.error('[Server] Failed to update listing status:', error);
      res.status(500).json({ error: 'Failed to update listing status.' });
    }
  }
);

// DELETE /api/listings/:id
app.delete('/api/listings/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = Number(req.params.id);
    if (Number.isNaN(listingId)) {
      res.status(400).json({ error: 'Invalid listing ID.' });
      return;
    }

    const listing = db
      .prepare('SELECT id, seller_id, image_url FROM listings WHERE id = ?')
      .get(listingId) as { id: number; seller_id: number; image_url: string } | undefined;

    if (!listing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    if (req.user!.role !== 'ADMIN' && listing.seller_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to delete this listing.' });
      return;
    }

    const images = db
      .prepare('SELECT image_url FROM listing_images WHERE listing_id = ?')
      .all(listingId) as Array<{ image_url: string }>;

    removeUploadedFileIfPresent(listing.image_url);
    for (const img of images) {
      removeUploadedFileIfPresent(img.image_url);
    }

    db.prepare('DELETE FROM messages WHERE listing_id = ?').run(listingId);
    db.prepare('DELETE FROM listing_images WHERE listing_id = ?').run(listingId);
    db.prepare('DELETE FROM listings WHERE id = ?').run(listingId);

    res.json({ success: true, deletedId: listingId });
  } catch (error) {
    console.error('[Server] Failed to delete listing:', error);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

// POST /api/messages (Send in-app message to seller or buyer regarding a listing)
app.post('/api/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = Number(req.body?.listing_id ?? req.body?.listingId);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    const explicitReceiverId = req.body?.receiver_id ?? req.body?.receiverId;

    if (Number.isNaN(listingId) || !content) {
      res.status(400).json({ error: 'Fields listing_id and non-empty content are required.' });
      return;
    }

    const listing = db
      .prepare('SELECT id, seller_id, title FROM listings WHERE id = ?')
      .get(listingId) as { id: number; seller_id: number; title: string } | undefined;

    if (!listing) {
      res.status(404).json({ error: 'Referenced listing does not exist.' });
      return;
    }

    let receiverId =
      explicitReceiverId !== undefined && !Number.isNaN(Number(explicitReceiverId))
        ? Number(explicitReceiverId)
        : listing.seller_id;

    if (receiverId === req.user!.id && listing.seller_id === req.user!.id) {
      // If seller is replying without specifying receiver_id, find the most recent other participant on this listing
      const lastParticipant = db
        .prepare(`
          SELECT sender_id, receiver_id
          FROM messages
          WHERE listing_id = ? AND (sender_id != ? OR receiver_id != ?)
          ORDER BY id DESC
          LIMIT 1
        `)
        .get(listingId, req.user!.id, req.user!.id) as
        | { sender_id: number; receiver_id: number }
        | undefined;

      if (lastParticipant) {
        receiverId =
          lastParticipant.sender_id !== req.user!.id
            ? lastParticipant.sender_id
            : lastParticipant.receiver_id;
      }
    }

    if (receiverId === req.user!.id) {
      res.status(400).json({
        error: 'You cannot send a message to yourself on your own listing.',
      });
      return;
    }

    const insertResult = db
      .prepare(`
        INSERT INTO messages (listing_id, sender_id, receiver_id, content)
        VALUES (?, ?, ?, ?)
      `)
      .run(listingId, req.user!.id, receiverId, content);

    const createdMessage = db
      .prepare(`
        SELECT
          m.*,
          su.name as sender_name,
          su.email as sender_email,
          ru.name as receiver_name,
          ru.email as receiver_email,
          l.title as listing_title
        FROM messages m
        LEFT JOIN users su ON m.sender_id = su.id
        LEFT JOIN users ru ON m.receiver_id = ru.id
        LEFT JOIN listings l ON m.listing_id = l.id
        WHERE m.id = ?
      `)
      .get(insertResult.lastInsertRowid) as MessageRecord;

    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('[Server] Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET /api/messages/session (Retrieve authenticated user's chat history grouped by listing)
app.get('/api/messages/session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const messages = db
      .prepare(`
        SELECT
          m.*,
          su.name as sender_name,
          su.email as sender_email,
          ru.name as receiver_name,
          ru.email as receiver_email,
          l.title as listing_title,
          l.price as listing_price,
          l.price_type as listing_price_type,
          l.status as listing_status,
          l.seller_id as listing_seller_id,
          l.pickup_location as listing_pickup_location,
          lu.name as seller_name,
          lu.contact_number as seller_contact
        FROM messages m
        INNER JOIN listings l ON m.listing_id = l.id
        LEFT JOIN users su ON m.sender_id = su.id
        LEFT JOIN users ru ON m.receiver_id = ru.id
        LEFT JOIN users lu ON l.seller_id = lu.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.id ASC
      `)
      .all(userId, userId) as Array<any>;

    const groupedMap = new Map<
      number,
      {
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
        unread_count: number;
        messages: MessageRecord[];
      }
    >();

    for (const row of messages) {
      const counterpartId = row.sender_id === userId ? row.receiver_id : row.sender_id;
      const counterpartName =
        row.sender_id === userId
          ? row.receiver_name || `User #${row.receiver_id}`
          : row.sender_name || `User #${row.sender_id}`;

      if (!groupedMap.has(row.listing_id)) {
        groupedMap.set(row.listing_id, {
          listing_id: row.listing_id,
          listing_title: row.listing_title,
          listing_price: row.listing_price,
          listing_price_type: row.listing_price_type,
          listing_status: row.listing_status || 'AVAILABLE',
          listing_seller_id: row.listing_seller_id,
          listing_pickup_location: row.listing_pickup_location,
          seller_name: row.seller_name || 'Campus Seller',
          seller_contact: row.seller_contact || '+49 3677 69-0',
          counterpart_id: counterpartId,
          counterpart_name: counterpartName,
          unread_count: 0,
          messages: [],
        });
      }

      const group = groupedMap.get(row.listing_id)!;
      group.counterpart_id = counterpartId;
      group.counterpart_name = counterpartName;
      if (row.receiver_id === userId && !row.is_read) {
        group.unread_count += 1;
      }
      group.messages.push({
        id: row.id,
        listing_id: row.listing_id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.content,
        is_read: Number(row.is_read || 0),
        created_at: row.created_at,
        sender_name: row.sender_name,
        sender_email: row.sender_email,
        receiver_name: row.receiver_name,
        receiver_email: row.receiver_email,
        listing_title: row.listing_title,
      });
    }

    res.json({
      threads: Array.from(groupedMap.values()),
    });
  } catch (error) {
    console.error('[Server] Failed to fetch message sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve message history.' });
  }
});

// PATCH /api/messages/read (Mark messages in a listing thread as read for the authenticated user)
app.patch('/api/messages/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = Number(req.body?.listing_id ?? req.body?.listingId);
    if (Number.isNaN(listingId)) {
      res.status(400).json({ error: 'Valid listing_id is required.' });
      return;
    }

    db.prepare(
      'UPDATE messages SET is_read = 1 WHERE listing_id = ? AND receiver_id = ?'
    ).run(listingId, req.user!.id);

    res.json({ success: true, listing_id: listingId });
  } catch (error) {
    console.error('[Server] Failed to mark messages as read:', error);
    res.status(500).json({ error: 'Failed to update message read status.' });
  }
});

// GET /api/admin/overview
app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawUsers = db
      .prepare('SELECT * FROM users ORDER BY id ASC')
      .all() as UserRecord[];
    const users = rawUsers.map(toPublicUser);

    const rawListings = db
      .prepare(`
        SELECT
          l.*,
          u.name as seller_name,
          u.email as seller_email,
          u.contact_number as seller_contact
        FROM listings l
        LEFT JOIN users u ON l.seller_id = u.id
        ORDER BY l.id ASC
      `)
      .all() as ListingRecord[];

    res.json({ users, listings: attachImagesToListings(rawListings) });
  } catch (error) {
    console.error('[Server] Failed to fetch admin overview:', error);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// DELETE /api/users/:id (Admin-only cascading user deletion)
app.delete('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = Number(req.params.id);
    if (Number.isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID.' });
      return;
    }

    const userRecord = db
      .prepare('SELECT id, email, role FROM users WHERE id = ?')
      .get(targetUserId) as { id: number; email: string; role: string } | undefined;

    if (!userRecord) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (userRecord.role === 'ADMIN') {
      res.status(403).json({
        error: 'Action denied: Admin accounts cannot be deleted.',
        message: 'Action denied: Admin accounts cannot be deleted.',
      });
      return;
    }

    // Collect all uploaded image files associated with this user's listings
    const userListings = db
      .prepare('SELECT id, image_url FROM listings WHERE seller_id = ?')
      .all(targetUserId) as Array<{ id: number; image_url: string }>;

    const getListingImagesStmt = db.prepare(
      'SELECT image_url FROM listing_images WHERE listing_id = ?'
    );

    for (const listing of userListings) {
      removeUploadedFileIfPresent(listing.image_url);
      const galleryImages = getListingImagesStmt.all(listing.id) as Array<{ image_url: string }>;
      for (const img of galleryImages) {
        removeUploadedFileIfPresent(img.image_url);
      }
    }

    const deleteUserTx = db.transaction(() => {
      db.prepare('DELETE FROM auth_codes WHERE LOWER(email) = LOWER(?)').run(userRecord.email);
      db.prepare(
        `DELETE FROM messages
         WHERE sender_id = ?
            OR receiver_id = ?
            OR listing_id IN (SELECT id FROM listings WHERE seller_id = ?)`
      ).run(targetUserId, targetUserId, targetUserId);
      db.prepare(
        'DELETE FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE seller_id = ?)'
      ).run(targetUserId);
      db.prepare('DELETE FROM listings WHERE seller_id = ?').run(targetUserId);
      db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);
    });

    deleteUserTx();

    res.json({ success: true, deletedId: targetUserId });
  } catch (error) {
    console.error('[Server] Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user profile.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[IlmExchange Backend] Listening on http://localhost:${PORT}`);
  });
}

export default app;
