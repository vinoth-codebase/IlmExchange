# IlmExchange — TU Ilmenau Peer Marketplace & Web Component Library

IlmExchange is a full-stack peer-to-peer student marketplace and cross-framework design system built for the Technische Universitat Ilmenau campus community. It combines a React 18 storefront host application with encapsulated Lit Web Components (Shadow DOM + Custom Events) and a Node.js + Express + SQLite backend with OTP-based authentication.

---

## Live Demo Access

- **Live Frontend URL (Vercel):** https://ilm-exchange.vercel.app

### Admin Dashboard Testing

To evaluate the Admin Moderation Console (user management and ad moderation), use the following pre-configured demo credentials:
**Email:** admin@ilmexchange.com
**Password:** Admin123!

---

## Architecture Overview

1. **The Storefront (React 18 + Lit Interop):**
   - Institutional TU Ilmenau visual language: Slate-White (`#F8FAFC`) canvas, Deep Royal Blue (`#003a63`) navigation bar, and Technical Teal (`#0D9488`) interactive controls.
   - Compact 2-row by 4-column (`2x4`) grid layout with `4:3` listing media cards designed to fit above the fold, paired with circular `<` and `>` carousel pagination controls.
   - Passwordless 6-digit OTP email authentication via Gmail SMTP (`nodemailer`) with automatic `ADMIN` role elevation for the institutional moderator (`vinothofficial14@gmail.com`).
2. **The Component Docs (Cross-Framework Design System Portal):**
   - Interactive live playground for isolated Lit Web Components (`<ilm-search-bar>`, `<ilm-listing-card>`, `<ilm-favorites-drawer>`).
   - Real-time property controls, Shadow DOM telemetry inspection, and copy-ready integration snippets for **React**, **Angular**, and **Vue**.

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
