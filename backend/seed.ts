import bcrypt from 'bcryptjs';
import { db, initializeDatabase, ListingStatus } from './database';

export function createProductSvgDataUri(
  title: string,
  subtitle: string,
  accentHex: string,
  illustrationMarkup: string,
  badgeText: string = 'TU ILMENAU VERIFIED'
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F1F5F9"/>
        <stop offset="100%" stop-color="#E2E8F0"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" stroke-width="0.7" stroke-opacity="0.55"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <rect width="800" height="600" fill="url(#grid)"/>
    <circle cx="400" cy="275" r="195" fill="#FFFFFF" fill-opacity="0.88" stroke="#CBD5E1" stroke-width="2"/>
    <g transform="translate(0, 0)">
      ${illustrationMarkup}
    </g>
    <rect x="28" y="28" width="210" height="34" rx="6" fill="#003a63"/>
    <text x="44" y="50" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#FFFFFF" letter-spacing="0.06em">${badgeText}</text>
    <rect x="28" y="510" width="744" height="62" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect x="28" y="510" width="8" height="62" rx="4" fill="${accentHex}"/>
    <text x="52" y="538" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#0F172A">${title}</text>
    <text x="52" y="559" font-family="JetBrains Mono, monospace" font-size="13" fill="#475569">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function seedDatabase(): void {
  initializeDatabase();

  const defaultPasswordHash = bcrypt.hashSync('Ilmenau2026!', 10);

  const existingUsersCount = (
    db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  ).count;

  if (existingUsersCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, contact_number, is_verified, role)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
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
    // Ensure migrated users have valid password_hash, contact_number, and is_verified = 1
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

  if (existingListingsCount === 0) {
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
      gallery: string[];
    }> = [
      {
        seller_id: sellerA,
        title: '26-inch Mountain Bike',
        price: 115,
        price_type: 'VB',
        category: 'Bikes & Mobility',
        condition: 'Very Good',
        pickup_location: 'Max-Planck-Ring, Haus D',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          '26-inch Alloy Trail Mountain Bike',
          'SHIMANO 21-SPEED // CAMPUS READY // HAUS D',
          '#0D9488',
          `
            <circle cx="290" cy="320" r="64" fill="none" stroke="#0F172A" stroke-width="12"/>
            <circle cx="290" cy="320" r="48" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="8 8"/>
            <circle cx="510" cy="320" r="64" fill="none" stroke="#0F172A" stroke-width="12"/>
            <circle cx="510" cy="320" r="48" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="8 8"/>
            <path d="M290 320 L365 225 L475 225 L395 320 Z" fill="none" stroke="#0D9488" stroke-width="12" stroke-linejoin="round"/>
            <path d="M365 225 L395 320 M475 225 L510 320" fill="none" stroke="#003a63" stroke-width="11" stroke-linecap="round"/>
            <path d="M342 200 L382 200" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
            <path d="M460 198 L498 192" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
          `,
          'SLIDE 1 // PROFILE VIEW'
        ),
        gallery: [],
      },
      {
        seller_id: sellerB,
        title: 'Smart Air Fryer 3.5L',
        price: 45,
        price_type: 'FIXED',
        category: 'Kitchen & Appliances',
        condition: 'Like New',
        pickup_location: 'Max-Planck-Ring, Haus M',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          'Smart Digital Air Fryer 3.5L',
          '1400W CONVECTION // OLED PRESETS // HAUS M',
          '#003a63',
          `
            <rect x="315" y="155" width="170" height="235" rx="34" fill="#1E293B" stroke="#0F172A" stroke-width="8"/>
            <rect x="342" y="182" width="116" height="54" rx="10" fill="#0F172A" stroke="#0D9488" stroke-width="3"/>
            <text x="400" y="216" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" font-weight="700" fill="#14B8A6">185 C</text>
            <path d="M315 268 L485 268" stroke="#475569" stroke-width="4"/>
            <rect x="386" y="286" width="28" height="72" rx="12" fill="#0D9488"/>
          `,
          'SLIDE 1 // FRONT UNIT'
        ),
        gallery: [],
      },
      {
        seller_id: sellerAdmin,
        title: 'Dell 27 USB-C Monitor',
        price: 140,
        price_type: 'VB',
        category: 'Electronics & Monitors',
        condition: 'Excellent',
        pickup_location: 'Ehrenbergstrasse, Zusebau',
        status: 'RESERVED',
        image_url: createProductSvgDataUri(
          'Dell UltraSharp 27 QHD USB-C Hub Monitor',
          '2560x1440 IPS // 65W PD // ZUSEBAU',
          '#0D9488',
          `
            <rect x="260" y="160" width="280" height="175" rx="10" fill="#0F172A" stroke="#334155" stroke-width="8"/>
            <rect x="272" y="172" width="256" height="146" rx="4" fill="#003a63"/>
            <path d="M292 288 L355 232 L410 264 L485 198" fill="none" stroke="#14B8A6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="382" y="335" width="36" height="48" fill="#64748B"/>
            <rect x="330" y="380" width="140" height="14" rx="5" fill="#475569"/>
          `,
          'SLIDE 1 // DISPLAY PANEL'
        ),
        gallery: [],
      },
      {
        seller_id: sellerA,
        title: 'LED Study Desk Lamp',
        price: 18,
        price_type: 'FIXED',
        category: 'Dorm & Furniture',
        condition: 'Good',
        pickup_location: 'Max-Planck-Ring, Haus B',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          'Architect Articulated LED Desk Lamp',
          '3 COLOR MODES // USB PORT // HAUS B',
          '#003a63',
          `
            <rect x="330" y="372" width="140" height="18" rx="8" fill="#1E293B"/>
            <path d="M375 372 L335 260 L435 178" fill="none" stroke="#003a63" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M418 164 L496 204 L468 230 L398 190 Z" fill="#0D9488"/>
            <path d="M452 222 L515 345 L395 345 Z" fill="#FEF08A" fill-opacity="0.38"/>
          `,
          'SLIDE 1 // DESK PROFILE'
        ),
        gallery: [],
      },
      {
        seller_id: sellerB,
        title: 'TI-30X Pro Calculator',
        price: 14,
        price_type: 'FIXED',
        category: 'Study & Textbooks',
        condition: 'Like New',
        pickup_location: 'Max-Planck-Ring, Haus A',
        status: 'SOLD',
        image_url: createProductSvgDataUri(
          'TI-30X Pro MathPrint Scientific Calculator',
          'EXAM APPROVED // SOLAR + BATTERY // HAUS A',
          '#0D9488',
          `
            <rect x="330" y="145" width="140" height="255" rx="18" fill="#1E293B" stroke="#0F172A" stroke-width="6"/>
            <rect x="348" y="168" width="104" height="52" rx="6" fill="#CBD5E1"/>
            <text x="442" y="203" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700" fill="#0F172A">3.14159</text>
            <g fill="#475569">
              <rect x="348" y="238" width="22" height="18" rx="3"/>
              <rect x="376" y="238" width="22" height="18" rx="3"/>
              <rect x="404" y="238" width="22" height="18" rx="3"/>
              <rect x="430" y="238" width="22" height="18" rx="3" fill="#0D9488"/>
              <rect x="348" y="266" width="22" height="18" rx="3"/>
              <rect x="376" y="266" width="22" height="18" rx="3"/>
              <rect x="404" y="266" width="22" height="18" rx="3"/>
              <rect x="430" y="266" width="22" height="18" rx="3" fill="#0D9488"/>
              <rect x="348" y="294" width="22" height="18" rx="3"/>
              <rect x="376" y="294" width="22" height="18" rx="3"/>
              <rect x="404" y="294" width="22" height="18" rx="3"/>
              <rect x="430" y="294" width="22" height="18" rx="3" fill="#003a63"/>
              <rect x="348" y="322" width="22" height="18" rx="3"/>
              <rect x="376" y="322" width="22" height="18" rx="3"/>
              <rect x="404" y="322" width="50" height="18" rx="3" fill="#0D9488"/>
            </g>
          `,
          'SLIDE 1 // KEYPAD LAYOUT'
        ),
        gallery: [],
      },
      {
        seller_id: sellerAdmin,
        title: 'Ergonomic Mesh Study Chair',
        price: 55,
        price_type: 'VB',
        category: 'Dorm & Furniture',
        condition: 'Very Good',
        pickup_location: 'Max-Planck-Ring, Haus K',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          'Breathable Lumbar Mesh Office Chair',
          'ADJUSTABLE ARMRESTS // TILT LOCK // HAUS K',
          '#003a63',
          `
            <rect x="352" y="148" width="96" height="128" rx="22" fill="#003a63" stroke="#0F172A" stroke-width="6"/>
            <rect x="336" y="276" width="128" height="26" rx="10" fill="#0D9488"/>
            <path d="M332 238 L332 290 M468 238 L468 290" stroke="#1E293B" stroke-width="8" stroke-linecap="round"/>
            <path d="M400 302 L400 372 M340 388 L400 372 L460 388" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
            <circle cx="340" cy="396" r="8" fill="#0F172A"/>
            <circle cx="400" cy="396" r="8" fill="#0F172A"/>
            <circle cx="460" cy="396" r="8" fill="#0F172A"/>
          `,
          'SLIDE 1 // LUMBAR PROFILE'
        ),
        gallery: [],
      },
      {
        seller_id: sellerA,
        title: 'Embedded Systems C++ Lab Kit',
        price: 35,
        price_type: 'VB',
        category: 'Study & Textbooks',
        condition: 'Complete Kit',
        pickup_location: 'Helmholtzplatz, Helmholtzbau',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          'STM32 Nucleo + Sensors C++ Lab Kit',
          'BREADBOARD // LOGIC ANALYZER // HELMHOLTZBAU',
          '#0D9488',
          `
            <rect x="285" y="185" width="230" height="175" rx="12" fill="#0D9488" stroke="#0F172A" stroke-width="6"/>
            <rect x="350" y="230" width="100" height="85" rx="6" fill="#1E293B"/>
            <text x="400" y="278" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700" fill="#F8FAFC">ARM CORTEX</text>
            <g stroke="#FACC15" stroke-width="5" stroke-linecap="round">
              <line x1="312" y1="210" x2="312" y2="335"/>
              <line x1="326" y1="210" x2="326" y2="335"/>
              <line x1="474" y1="210" x2="474" y2="335"/>
              <line x1="488" y1="210" x2="488" y2="335"/>
            </g>
          `,
          'SLIDE 1 // BOARD OVERVIEW'
        ),
        gallery: [],
      },
      {
        seller_id: sellerB,
        title: 'Electric Gooseneck Kettle',
        price: 22,
        price_type: 'FIXED',
        category: 'Kitchen & Appliances',
        condition: 'Very Good',
        pickup_location: 'Max-Planck-Ring, Haus N',
        status: 'AVAILABLE',
        image_url: createProductSvgDataUri(
          'Stainless Pour-Over Gooseneck Kettle 1.0L',
          'MATTE BLACK // TEMPERATURE HOLD // HAUS N',
          '#003a63',
          `
            <path d="M340 215 L450 215 L468 355 L322 355 Z" fill="#1E293B" stroke="#0F172A" stroke-width="6" stroke-linejoin="round"/>
            <path d="M458 315 C512 315, 505 215, 542 195" fill="none" stroke="#0D9488" stroke-width="12" stroke-linecap="round"/>
            <path d="M332 235 C288 235, 288 325, 326 325" fill="none" stroke="#003a63" stroke-width="12" stroke-linecap="round"/>
            <rect x="355" y="196" width="80" height="16" rx="6" fill="#475569"/>
            <rect x="305" y="362" width="180" height="18" rx="6" fill="#0F172A"/>
          `,
          'SLIDE 1 // KETTLE & BASE'
        ),
        gallery: [],
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

        const slide2 = createProductSvgDataUri(
          `${item.title} — Technical Specification`,
          `CONDITION: ${item.condition.toUpperCase()} // CATEGORY: ${item.category.toUpperCase()}`,
          '#003a63',
          `
            <rect x="250" y="170" width="300" height="210" rx="12" fill="#0F172A" stroke="#0D9488" stroke-width="5"/>
            <text x="400" y="245" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="18" font-weight="700" fill="#14B8A6">INSPECTION VERIFIED</text>
            <text x="400" y="285" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" fill="#E2E8F0">EUR ${item.price} (${item.price_type})</text>
            <text x="400" y="320" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#94A3B8">${item.pickup_location}</text>
          `,
          'SLIDE 2 // SPEC SHEET'
        );

        const slide3 = createProductSvgDataUri(
          `${item.title} — Handover Location`,
          `PICKUP POINT: ${item.pickup_location.toUpperCase()}`,
          '#0D9488',
          `
            <rect x="260" y="175" width="280" height="200" rx="12" fill="#F8FAFC" stroke="#003a63" stroke-width="5"/>
            <circle cx="400" cy="255" r="32" fill="#0D9488" fill-opacity="0.2" stroke="#0D9488" stroke-width="4"/>
            <circle cx="400" cy="255" r="10" fill="#003a63"/>
            <text x="400" y="335" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="#003a63">${item.pickup_location}</text>
          `,
          'SLIDE 3 // CAMPUS PICKUP'
        );

        insertImage.run(listingId, item.image_url);
        insertImage.run(listingId, slide2);
        insertImage.run(listingId, slide3);
      }
    });

    seedTransaction();
    console.log('[Seed] Populated SQLite database with 8 TU Ilmenau campus listings and multi-image galleries.');
  } else {
    // Ensure any existing listings without listing_images entries get 3 gallery slides
    const allListings = db.prepare('SELECT * FROM listings').all() as Array<{
      id: number;
      title: string;
      price: number;
      price_type: string;
      category: string;
      condition: string;
      pickup_location: string;
      image_url: string;
    }>;
    const countImagesStmt = db.prepare(
      'SELECT COUNT(*) as count FROM listing_images WHERE listing_id = ?'
    );
    const insertImage = db.prepare(
      'INSERT INTO listing_images (listing_id, image_url) VALUES (?, ?)'
    );

    for (const item of allListings) {
      const imgCount = (countImagesStmt.get(item.id) as { count: number }).count;
      if (imgCount === 0) {
        const slide2 = createProductSvgDataUri(
          `${item.title} — Technical Specification`,
          `CONDITION: ${item.condition.toUpperCase()} // CATEGORY: ${item.category.toUpperCase()}`,
          '#003a63',
          `
            <rect x="250" y="170" width="300" height="210" rx="12" fill="#0F172A" stroke="#0D9488" stroke-width="5"/>
            <text x="400" y="245" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="18" font-weight="700" fill="#14B8A6">INSPECTION VERIFIED</text>
            <text x="400" y="285" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" fill="#E2E8F0">EUR ${item.price} (${item.price_type})</text>
            <text x="400" y="320" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#94A3B8">${item.pickup_location}</text>
          `,
          'SLIDE 2 // SPEC SHEET'
        );
        const slide3 = createProductSvgDataUri(
          `${item.title} — Handover Location`,
          `PICKUP POINT: ${item.pickup_location.toUpperCase()}`,
          '#0D9488',
          `
            <rect x="260" y="175" width="280" height="200" rx="12" fill="#F8FAFC" stroke="#003a63" stroke-width="5"/>
            <circle cx="400" cy="255" r="32" fill="#0D9488" fill-opacity="0.2" stroke="#0D9488" stroke-width="4"/>
            <circle cx="400" cy="255" r="10" fill="#003a63"/>
            <text x="400" y="335" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="#003a63">${item.pickup_location}</text>
          `,
          'SLIDE 3 // CAMPUS PICKUP'
        );
        insertImage.run(item.id, item.image_url);
        insertImage.run(item.id, slide2);
        insertImage.run(item.id, slide3);
      }
    }
  }

  // Seed initial sample messages if messages table is empty
  const existingMessagesCount = (
    db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
  ).count;

  if (existingMessagesCount === 0) {
    const firstListing = db
      .prepare('SELECT id, seller_id FROM listings ORDER BY id ASC LIMIT 1')
      .get() as { id: number; seller_id: number } | undefined;
    const thirdListing = db
      .prepare('SELECT id, seller_id FROM listings ORDER BY id ASC LIMIT 1 OFFSET 2')
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
        'Hello Lukas, is the 26-inch Mountain Bike still available for inspection near Haus D today?'
      );
      insertMessage.run(
        firstListing.id,
        firstListing.seller_id,
        sellerAdmin,
        'Yes! I am at Max-Planck-Ring Haus D after 17:00. Both Shimano derailleurs were tuned last week.'
      );
    }

    if (thirdListing && sellerB !== thirdListing.seller_id) {
      insertMessage.run(
        thirdListing.id,
        sellerB,
        thirdListing.seller_id,
        'Hi Vinothkumar, does the Dell 27 USB-C Monitor include the 65W USB-C power delivery cable?'
      );
      insertMessage.run(
        thirdListing.id,
        thirdListing.seller_id,
        sellerB,
        'Yes, original Dell USB-C cable and stand are included. Pickup at Zusebau lobby.'
      );
    }
  }
}

if (require.main === module) {
  seedDatabase();
}
