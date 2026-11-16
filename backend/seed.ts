import bcrypt from 'bcryptjs';
import { db, initializeDatabase, ListingStatus } from './database';

export function seedDatabase(forceResetListings: boolean = false): void {
  initializeDatabase();

  const defaultPasswordHash = bcrypt.hashSync('Ilmenau2026!', 10);
  const demoAdminPasswordHash = bcrypt.hashSync('Admin123!', 10);

  const existingUsersCount = (
    db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  ).count;

  if (existingUsersCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, contact_number, is_verified, role)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertUser.run(
      'admin@ilmexchange.com',
      demoAdminPasswordHash,
      'Demo Admin',
      '+49 3677 69-0',
      'ADMIN'
    );
    insertUser.run(
      'vinothofficial14@gmail.com',
      defaultPasswordHash,
      'Vinothkumar N',
      '+49 152 08419201',
      'ADMIN'
    );
    insertUser.run(
      'lukas.weber@tu-ilmenau.de',
      defaultPasswordHash,
      'Lukas Weber',
      '+49 176 34189022',
      'STUDENT'
    );
    insertUser.run(
      'sophie.keller@tu-ilmenau.de',
      defaultPasswordHash,
      'Sophie Keller',
      '+49 151 78234190',
      'STUDENT'
    );
    insertUser.run(
      'max.richter@tu-ilmenau.de',
      defaultPasswordHash,
      'Max Richter',
      '+49 160 99120455',
      'STUDENT'
    );
  } else {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, is_verified = 1
      WHERE password_hash = '' OR password_hash IS NULL
    `).run(defaultPasswordHash);

    db.prepare(`
      UPDATE users SET contact_number = '+49 152 08419201' WHERE email = 'vinothofficial14@gmail.com'
    `).run();
    db.prepare(`
      UPDATE users SET contact_number = '+49 176 34189022' WHERE email = 'lukas.weber@tu-ilmenau.de'
    `).run();
    db.prepare(`
      UPDATE users SET contact_number = '+49 151 78234190' WHERE email = 'sophie.keller@tu-ilmenau.de'
    `).run();
  }

  // Always ensure the permanent Demo Admin account exists and is pre-verified on startup
  db.prepare(`
    INSERT INTO users (email, password_hash, name, contact_number, is_verified, role)
    VALUES (?, ?, 'Demo Admin', '+49 3677 69-0', 1, 'ADMIN')
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      name = 'Demo Admin',
      is_verified = 1,
      role = 'ADMIN'
  `).run('admin@ilmexchange.com', demoAdminPasswordHash);

  const adminUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('vinothofficial14@gmail.com') as { id: number } | undefined;
  const student1 = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('lukas.weber@tu-ilmenau.de') as { id: number } | undefined;
  const student2 = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('sophie.keller@tu-ilmenau.de') as { id: number } | undefined;

  const sellerA = student1?.id || adminUser?.id || 1;
  const sellerB = student2?.id || adminUser?.id || 1;
  const sellerAdmin = adminUser?.id || 1;

  const existingListingsCount = (
    db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }
  ).count;

  const legacySvgListingsCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM listings WHERE image_url LIKE 'data:image/svg+xml%'")
      .get() as { count: number }
  ).count;

  if (existingListingsCount === 0 || legacySvgListingsCount > 0 || forceResetListings) {
    const initialListings: Array<{
      seller_id: number;
      title: string;
      price: number;
      price_type: 'FIXED' | 'VB';
      category: string;
      condition: string;
      pickup_location: string;
      status: ListingStatus;
      image_url: string;
    }> = [
      {
        seller_id: sellerA,
        title: '26-inch Mountain Bike',
        price: 120,
        price_type: 'VB',
        category: 'Bikes & Mobility',
        condition: 'Very Good',
        pickup_location: 'Haus L',
        status: 'AVAILABLE',
        image_url: '/assets/Cycle.avif',
      },
      {
        seller_id: sellerB,
        title: 'Xiaomi Smart Air Fryer 3.5L',
        price: 45,
        price_type: 'FIXED',
        category: 'Kitchen & Appliances',
        condition: 'Like New',
        pickup_location: 'Haus C',
        status: 'AVAILABLE',
        image_url: '/assets/Air Fryer.avif',
      },
      {
        seller_id: sellerAdmin,
        title: 'Ergonomic Desk Chair',
        price: 30,
        price_type: 'VB',
        category: 'Dorm & Furniture',
        condition: 'Very Good',
        pickup_location: 'Haus K',
        status: 'AVAILABLE',
        image_url: '/assets/Chair.avif',
      },
      {
        seller_id: sellerAdmin,
        title: 'Dell G2724D 27" Monitor',
        price: 180,
        price_type: 'VB',
        category: 'Electronics & Monitors',
        condition: 'Excellent',
        pickup_location: 'Haus A',
        status: 'AVAILABLE',
        image_url: '/assets/Dell G2724D.avif',
      },
      {
        seller_id: sellerB,
        title: 'Casio Scientific Calculator',
        price: 15,
        price_type: 'FIXED',
        category: 'Study & Textbooks',
        condition: 'Like New',
        pickup_location: 'Mensa Ehrenberg',
        status: 'AVAILABLE',
        image_url: '/assets/Casio.avif',
      },
      {
        seller_id: sellerA,
        title: 'Winter Jacket (Size M)',
        price: 40,
        price_type: 'VB',
        category: 'Others',
        condition: 'Very Good',
        pickup_location: 'City Center',
        status: 'AVAILABLE',
        image_url: '/assets/Winter jacket.avif',
      },
    ];

    const insertListing = db.prepare(`
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertImage = db.prepare(`
      INSERT INTO listing_images (listing_id, image_url) VALUES (?, ?)
    `);

    const seedTransaction = db.transaction(() => {
      db.prepare('DELETE FROM messages').run();
      db.prepare('DELETE FROM listing_images').run();
      db.prepare('DELETE FROM listings').run();

      for (const item of initialListings) {
        const res = insertListing.run(
          item.seller_id,
          item.title,
          item.price,
          item.price_type,
          item.category,
          item.condition,
          item.pickup_location,
          item.image_url,
          item.status
        );
        const listingId = Number(res.lastInsertRowid);
        insertImage.run(listingId, item.image_url);
      }
    });

    seedTransaction();
    console.log(
      '[Seed] Populated SQLite database with 6 static-asset TU Ilmenau campus listings.'
    );
  }

  // Seed initial sample messages if messages table is empty
  const existingMessagesCount = (
    db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
  ).count;

  if (existingMessagesCount === 0) {
    const firstListing = db
      .prepare('SELECT id, seller_id FROM listings ORDER BY id ASC LIMIT 1')
      .get() as { id: number; seller_id: number } | undefined;
    const fourthListing = db
      .prepare('SELECT id, seller_id FROM listings ORDER BY id ASC LIMIT 1 OFFSET 3')
      .get() as { id: number; seller_id: number } | undefined;

    const insertMessage = db.prepare(`
      INSERT INTO messages (listing_id, sender_id, receiver_id, content)
      VALUES (?, ?, ?, ?)
    `);

    if (firstListing && sellerAdmin !== firstListing.seller_id) {
      insertMessage.run(
        firstListing.id,
        sellerAdmin,
        firstListing.seller_id,
        'Hello Lukas, is the 26-inch Mountain Bike still available for inspection near Haus L today?'
      );
      insertMessage.run(
        firstListing.id,
        firstListing.seller_id,
        sellerAdmin,
        'Yes! I am at Haus L after 17:00. Both Shimano derailleurs were tuned last week.'
      );
    }

    if (fourthListing && sellerB !== fourthListing.seller_id) {
      insertMessage.run(
        fourthListing.id,
        sellerB,
        fourthListing.seller_id,
        'Hi Vinothkumar, does the Dell G2724D 27" Monitor include the DisplayPort cable?'
      );
      insertMessage.run(
        fourthListing.id,
        fourthListing.seller_id,
        sellerB,
        'Yes, original Dell DisplayPort cable and adjustable stand are included. Pickup at Haus A.'
      );
    }
  }
}

if (require.main === module) {
  seedDatabase(true);
}
