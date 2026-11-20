import bcrypt from 'bcryptjs';
import { db, initializeDatabase, ListingStatus } from './database';

export function seedDatabase(forceResetListings: boolean = false): void {
  initializeDatabase();

  const defaultPasswordHash = bcrypt.hashSync('Ilmenau2026!', 10);
  const demoAdminPasswordHash = bcrypt.hashSync('Admin123!', 10);
  const demoUserPasswordHash = bcrypt.hashSync('User123!', 10);

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
      'user1@ilmexchange.com',
      demoUserPasswordHash,
      'Demo User 1',
      '+49 176 34189022',
      'STUDENT'
    );
    insertUser.run(
      'user2@ilmexchange.com',
      demoUserPasswordHash,
      'Demo User 2',
      '+49 151 78234190',
      'STUDENT'
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

  // Always ensure the permanent Demo Admin and Demo Student accounts exist and are pre-verified on startup
  const upsertDemoUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, contact_number, is_verified, role)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      name = excluded.name,
      contact_number = excluded.contact_number,
      is_verified = 1,
      role = excluded.role
  `);

  upsertDemoUser.run(
    'admin@ilmexchange.com',
    demoAdminPasswordHash,
    'Demo Admin',
    '+49 3677 69-0',
    'ADMIN'
  );
  upsertDemoUser.run(
    'user1@ilmexchange.com',
    demoUserPasswordHash,
    'Demo User 1',
    '+49 176 34189022',
    'STUDENT'
  );
  upsertDemoUser.run(
    'user2@ilmexchange.com',
    demoUserPasswordHash,
    'Demo User 2',
    '+49 151 78234190',
    'STUDENT'
  );

  const adminUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('admin@ilmexchange.com') as { id: number } | undefined;
  const demoUser1 = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('user1@ilmexchange.com') as { id: number } | undefined;
  const demoUser2 = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('user2@ilmexchange.com') as { id: number } | undefined;

  const sellerA = demoUser1?.id || adminUser?.id || 1;
  const sellerB = demoUser2?.id || adminUser?.id || 1;
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

  // Migrate any legacy hardcoded greeting names in existing messages
  db.prepare(`
    UPDATE messages
    SET content = REPLACE(content, 'Hello Lukas,', 'Hello Demo User 1,')
    WHERE content LIKE '%Hello Lukas,%'
  `).run();
  db.prepare(`
    UPDATE messages
    SET content = REPLACE(content, 'Hi Vinothkumar,', 'Hi Demo Admin,')
    WHERE content LIKE '%Hi Vinothkumar,%'
  `).run();

  // Seed initial sample messages if messages table is empty
  const existingMessagesCount = (
    db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
  ).count;

  if (existingMessagesCount === 0) {
    const firstListing = db
      .prepare(`
        SELECT l.id, l.seller_id, u.name as seller_name
        FROM listings l
        LEFT JOIN users u ON l.seller_id = u.id
        ORDER BY l.id ASC
        LIMIT 1
      `)
      .get() as { id: number; seller_id: number; seller_name?: string } | undefined;
    const fourthListing = db
      .prepare(`
        SELECT l.id, l.seller_id, u.name as seller_name
        FROM listings l
        LEFT JOIN users u ON l.seller_id = u.id
        ORDER BY l.id ASC
        LIMIT 1 OFFSET 3
      `)
      .get() as { id: number; seller_id: number; seller_name?: string } | undefined;

    const insertMessage = db.prepare(`
      INSERT INTO messages (listing_id, sender_id, receiver_id, content)
      VALUES (?, ?, ?, ?)
    `);

    if (firstListing && sellerAdmin !== firstListing.seller_id) {
      const sellerName1 = firstListing.seller_name || 'Demo User 1';
      insertMessage.run(
        firstListing.id,
        sellerAdmin,
        firstListing.seller_id,
        `Hello ${sellerName1}, is the 26-inch Mountain Bike still available for inspection near Haus L today?`
      );
      insertMessage.run(
        firstListing.id,
        firstListing.seller_id,
        sellerAdmin,
        'Yes! I am at Haus L after 17:00. Both Shimano derailleurs were tuned last week.'
      );
    }

    if (fourthListing && sellerB !== fourthListing.seller_id) {
      const sellerName4 = fourthListing.seller_name || 'Demo Admin';
      insertMessage.run(
        fourthListing.id,
        sellerB,
        fourthListing.seller_id,
        `Hi ${sellerName4}, does the Dell G2724D 27" Monitor include the DisplayPort cable?`
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
