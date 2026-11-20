# IlmExchange — TU Ilmenau Peer Marketplace & Web Component Library

IlmExchange is a full-stack peer-to-peer student marketplace and cross-framework design system built for the Technische Universitat Ilmenau campus community. It combines a React 18 storefront host application with encapsulated Lit Web Components (Shadow DOM + Custom Events) and a Node.js + Express + SQLite backend with OTP-based authentication.

---

## Live Demo Access

- **Live Frontend URL (Vercel):** https://ilm-exchange.vercel.app

### Demo Credentials (Pre-Verified Accounts)

To evaluate the platform's peer-to-peer student workflows (publishing ads, managing ad lifecycle statuses, and testing buyer-seller messaging) as well as the Admin Moderation Console (user management and ad moderation), use the following pre-configured demo accounts:

| Account Role | Name | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Demo Admin | `admin@ilmexchange.com` | `Admin123!` | Full access to the Admin Moderation Console, listing moderation, and student account deletion |
| **Student 1** | Demo User 1 | `user1@ilmexchange.com` | `User123!` | Publish campus ads, manage "My Ads" lifecycle status (`AVAILABLE` / `RESERVED` / `SOLD`), and chat in Inbox |
| **Student 2** | Demo User 2 | `user2@ilmexchange.com` | `User123!` | Browse listings, bookmark favorites, message sellers, and test two-way buyer-seller chat with Demo User 1 |

---

## Architecture Overview

IlmExchange is engineered as a hybrid micro-frontend and full-stack web application that demonstrates standards-compliant Web Component interoperability alongside a transactional REST API:

1. **Hybrid React 18 Host & Lit 3 Web Component Interoperability:**
   - The storefront host application is built with **React 18** and **TypeScript**, managing top-level routing, authentication state, and API orchestration.
   - Core reusable UI primitives—`<ilm-listing-card>`, `<ilm-search-bar>`, `<ilm-image-carousel>`, and `<ilm-favorites-drawer>`—are implemented as framework-agnostic **Lit 3 Custom Elements** utilizing native **Shadow DOM** style encapsulation.
   - Cross-framework communication is driven by standard DOM properties down and bubbling, composed `CustomEvent` payloads (`ilm-search`, `ilm-card-select`, `ilm-favorite-toggle`, `ilm-slide-change`) up to the React host.
2. **Peer-to-Peer Marketplace & Ad Lifecycle Management:**
   - Supports multi-photo item listings (1 to 5 images per ad via `multipart/form-data` uploads) mapped across verified TU Ilmenau campus pickup zones (`Haus A`–`Haus Q`, `Haus Zapf`, `Mensa Ehrenberg`, and `City Center`) and six campus categories.
   - Sellers can dynamically transition listings through real-time lifecycle states (`AVAILABLE`, `RESERVED`, and `SOLD`) from the **My Ads** dashboard, immediately updating status badges across the storefront and active chat threads.
   - An automated background cleanup cron job purges expired listings and their associated uploaded image files after 30 days to prevent storage bloat.
3. **In-App Buyer/Seller Messaging & Authentication Engine:**
   - Implements JWT-authenticated REST endpoints with `bcrypt` password hashing and 6-digit email verification and password reset workflows via `nodemailer` SMTP (with an automatic local development code fallback).
   - Provides listing-scoped chat threads inside an interactive **Inbox Drawer** and **Ad Canvas Modal**, complete with per-thread unread message tracking (`is_read` state persistence) and instant buyer-seller reply synchronization.
4. **Role-Based Admin Moderation & Developer Design System Portal:**
   - **Admin Moderation Console:** Protected by strict `ADMIN` JWT middleware and role-based safeguards that prevent admin account deletion while enabling cascading deletion of offending student profiles (automatically cleaning up associated listings, uploaded files, messages, and auth codes in a single SQLite transaction).
   - **Developer API & Design System Portal:** An interactive documentation playground where developers can manipulate live `<ilm-listing-card>` and `<ilm-search-bar>` properties, inspect real-time Shadow DOM `CustomEvent` telemetry streams, and copy production-ready integration code for **React 18**, **Angular**, and **Vue 3**.

---

## Repository Structure

```text
IlmExchange/
├── .env.example
├── .gitignore
├── README.md
├── render.yaml
├── start_app.sh
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── server.ts
│   ├── database.ts
│   ├── auth.ts
│   ├── mailer.ts
│   └── seed.ts
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vercel.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── components/
        │   ├── lit/
        │   │   ├── ilm-listing-card.ts
        │   │   ├── ilm-search-bar.ts
        │   │   ├── ilm-favorites-drawer.ts
        │   │   └── lit-components.test.ts
        │   └── react/
        │       ├── Header.tsx
        │       ├── Footer.tsx
        │       ├── Storefront.tsx
        │       ├── ComponentDocs.tsx
        │       └── AdminDashboard.tsx
        └── styles/
            └── globals.css
```

---

## Local Quickstart (macOS / Linux — No Docker Required)

1. Copy `.env.example` to `backend/.env` and configure `SMTP_APP_PASSWORD` if testing live Gmail SMTP delivery (a built-in development fallback also logs and returns the demo OTP code when `SMTP_APP_PASSWORD` is omitted).
2. Run the unified launcher script from the project root:

```bash
chmod +x start_app.sh
./start_app.sh
```

- **Frontend (Vite + React + Lit):** `http://localhost:5173`
- **Backend API (Express + SQLite):** `http://localhost:3000`

---

## Running Unit Tests

To run the Vitest DOM test suite verifying Lit Custom Elements, Shadow DOM rendering, and `CustomEvent` payloads:

```bash
cd frontend
npm test
```

---

## API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service status and database telemetry |
| `GET` | `/api/listings` | Public | Retrieve campus listings with optional category, campus, and query filters |
| `POST` | `/api/listings` | `STUDENT` / `ADMIN` | Publish a new marketplace listing |
| `DELETE` | `/api/listings/:id` | `ADMIN` | Remove a listing from the marketplace |
| `POST` | `/api/auth/request-otp` | Public | Generate and dispatch a 6-digit OTP to the user email |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit OTP and issue a signed JWT (`ADMIN` or `STUDENT`) |
| `GET` | `/api/admin/overview` | `ADMIN` | Fetch registered users and active listings for moderation |
