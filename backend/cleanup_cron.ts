import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { db } from './database';

export function removeUploadedFileIfPresent(imageUrl: string): void {
  if (!imageUrl || !imageUrl.includes('/uploads/')) {
    return;
  }
  const fileName = imageUrl.split('/uploads/').pop();
  if (!fileName) return;

  const safeFileName = path.basename(fileName);
  const fullPath = path.join(__dirname, 'uploads', safeFileName);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.warn(`[CleanupCron] Failed to delete file ${fullPath}:`, error);
  }
}

export function runExpiredListingsCleanup(): { deletedListings: number; deletedImages: number } {
  const expiredListings = db
    .prepare(
      `SELECT id, image_url FROM listings WHERE created_at <= date('now', '-30 days')`
    )
    .all() as Array<{ id: number; image_url: string }>;

  if (expiredListings.length === 0) {
    return { deletedListings: 0, deletedImages: 0 };
  }

  let deletedImages = 0;

  const cleanupTransaction = db.transaction(() => {
    for (const listing of expiredListings) {
      removeUploadedFileIfPresent(listing.image_url);

      const images = db
        .prepare('SELECT image_url FROM listing_images WHERE listing_id = ?')
        .all(listing.id) as Array<{ image_url: string }>;

      for (const img of images) {
        removeUploadedFileIfPresent(img.image_url);
        deletedImages += 1;
      }

      db.prepare('DELETE FROM messages WHERE listing_id = ?').run(listing.id);
      db.prepare('DELETE FROM listing_images WHERE listing_id = ?').run(listing.id);
    }

    const result = db
      .prepare(`DELETE FROM listings WHERE created_at <= date('now', '-30 days')`)
      .run();

    return result.changes;
  });

  const deletedListings = cleanupTransaction();
  console.log(
    `[CleanupCron] Purged ${deletedListings} expired listings (>30 days old) and ${deletedImages} gallery images.`
  );
  return { deletedListings, deletedImages };
}

export function startCleanupCronJob(): void {
  // Run once on server initialization
  runExpiredListingsCleanup();

  // Schedule daily execution at 02:00 AM server time
  cron.schedule('0 2 * * *', () => {
    runExpiredListingsCleanup();
  });

  console.log('[CleanupCron] Daily 30-day listing expiration task registered (0 2 * * *).');
}
