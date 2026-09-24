# Trimly — The New Way to Get a Beautiful Cut 💈🇬🇭

**Trimly** is a production-grade, multi-tenant barber and salon booking SaaS engineered specifically for Ghana (Accra, Kumasi, Tema). Built with a mobile-first philosophy inspired by Airbnb's design tokens, Trimly eliminates long waiting bench times, eliminates double-bookings with database-level concurrency locks, and streamlines operations for barbershop owners.

---

## 🌟 Key Capabilities

1. **Mobile-First Public Booking Portal (`/book/[slug]`)**:
   - Seamless 5-step booking flow: Service Selection → Barber Selection ("Any Available" or specific specialist) → Live 15-min Slot Matrix → Client Details & Payment Choice → Boarding Pass with dynamic QR code.
   - Built-in deposit policies: Fixed GHS, Percentage, or Full upfront with MoMo (MTN MoMo, Telecel Cash, AT Money) or Pay-at-Shop.
   - Self-service booking management and instant cancellations (`/book/[slug]/manage`) with automated cancellation policy enforcement and countdown timers.

2. **Zero-Double-Booking Slot Engine**:
   - PostgreSQL GiST Exclusion Constraint (`btree_gist`) strictly rejects simultaneous booking attempts on overlapping intervals for the same chair at the database engine level.
   - 10-minute atomic hold manager prevents cart sniping and abandoned slot hoarding.
   - Verified by automated concurrency tests firing simultaneous racing requests.

3. **Owner Live Operations Dashboard (`/dashboard`)**:
   - Real-time station timeline with chair status (Available, In-Service, On-Break) powered by Supabase Realtime WebSocket subscriptions.
   - Instant Walk-In seat assignment drawer with automatic conflict avoidance.
   - Service menu management, staff station management, and shop settings (operating hours, deposit rules, cancellation windows).

4. **Staff Chair Schedule View (`/staff`)**:
   - Dedicated, distraction-free chair schedule for individual barbers showing their day's sequence, client notes, and status toggles.

5. **Shop Onboarding Wizard (`/onboard`)**:
   - 5-step guided wizard for new salon owners: Profile → Location & Chairs → Operating Hours → Service Menu Scaffolding → Booking Policies.

6. **Platform Admin Console (`/admin`)**:
   - Dedicated platform developer console for platform owner (**Martin** / `moseiboakye@st.knust.edu.gh`).
   - Platform GMV metrics, active shop oversight, shop suspension/reactivation killswitch, and detailed booking drilldown modals.

7. **PWA & Offline Pass**:
   - Installable Progressive Web App (`manifest.json`, `sw.js`).
   - Offline caching of booking passes, Web Push notifications (VAPID), and automated 1-hour appointment reminder cron (`/api/cron/reminders`).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.3.6](https://nextjs.org) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org) (Strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + Airbnb design tokens (`#ff385c`, Inter, smooth radii) |
| **Database** | [PostgreSQL 17](https://www.postgresql.org) via [Local Supabase](https://supabase.com) (Port 54321 / 54322) |
| **Concurrency** | Postgres `EXCLUDE USING gist (staff_id WITH =, tstzrange(start_at, end_at) WITH &&)` |
| **Realtime** | Supabase Realtime (WebSockets channel broadcast) |
| **Testing** | [Vitest 5.x](https://vitest.dev) (Unit & DB Concurrency) + [Playwright 1.x](https://playwright.dev) (End-to-End) |
| **Audit** | [Google Lighthouse](https://developers.google.com/web/tools/lighthouse) Mobile Engine |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js** v20+ (Node v24 recommended)
- **Docker** & **Docker Compose**
- **Supabase CLI** (`npm install -g supabase` or `npx supabase`)

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```

The default values in `.env.example` are preconfigured to match local Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialize Local Database
Start local Supabase containers and apply the schema and seed data:
```bash
npx supabase start
npx supabase db reset
```

The database comes pre-seeded with:
- **Platform Admin:** Martin (`moseiboakye@st.knust.edu.gh`)
- **Demo Shop:** Gentlemen's Cut (`gentlemens-cut`, Osu, Oxford Street, Accra)
- **Barber Staff:** Kojo Mensah (Master Barber), Kwame Asante (Senior Stylist), Emmanuel Osei (Barber & Scalp Specialist)
- **Service Menu:** The Executive Cut (45m), Beard Sculpt (30m), The Complete Package (75m), Kids Classic Cut (30m), Scalp Therapy (45m)
- **Operating Hours:** Mon–Sat 8:30 AM – 6:30 PM, Sun 12:00 PM – 5:00 PM

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Concurrency Engine: Preventing Double-Bookings

Traditional booking systems suffer from race conditions: two customers open the same 3:00 PM slot simultaneously, and application-level checks allow both to insert.

Trimly solves this at the database storage engine layer using PostgreSQL's `btree_gist` extension:

```sql
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));
```

When two concurrent requests hit `/api/bookings/hold` for the same barber at the same time:
1. Postgres serializes the row lock via GiST indexing.
2. The first transaction succeeds and creates an atomic hold.
3. The second transaction immediately raises Postgres exception `23P01` (exclusion violation).
4. `hold-manager.ts` catches `23P01` and cleanly returns a structured error:
   ```json
   {
     "success": false,
     "code": "SLOT_COLLISION",
     "error": "This time slot was just booked by another client. Please choose an alternative slot."
   }
   ```

You can verify this live behavior by running the concurrency test:
```bash
npm test -- src/lib/slot-engine/concurrency.test.ts
```

---

## 💳 Payment & SMS Integration Guide

Trimly ships with complete mock adapters for immediate local execution and zero-dependency testing, along with production-ready interfaces.

### Mobile Money & Card Payments (`src/lib/payments/`)
- **Mock Mode:** Enabled by default (`MOCK_PAYMENT_MODE=true`). Generates realistic reference codes and simulates instant confirmations.
- **Paystack Integration:**
  1. Set `PAYSTACK_SECRET_KEY=sk_live_...` and `PAYSTACK_PUBLIC_KEY=pk_live_...`.
  2. Implement webhook listener in `/api/webhooks/paystack` verifying the `x-paystack-signature` HMAC header.
  3. Confirm booking upon receiving `charge.success`.
- **Hubtel Integration:**
  1. Set `HUBTEL_CLIENT_ID` and `HUBTEL_CLIENT_SECRET`.
  2. Initialize Receive Mobile Money prompt via Hubtel Merchant API for direct USSD pushes to customer phones.

### SMS Notifications (`src/lib/notifications/sms.ts`)
- **Mock Mode:** Logs SMS payloads to stdout and local notifications table.
- **Arkesel Plug-in:**
  1. Set `ARKESEL_API_KEY=...` and `ARKESEL_SENDER_ID=Trimly`.
  2. Replace mock dispatch in `src/lib/notifications/sms.ts` with `POST https://sms.arkesel.com/api/v2/sms/send`.

---

## 🧪 Testing & Verification Suite

### Vitest Unit & Database Concurrency Tests
```bash
npm test
```
- `src/lib/utils.test.ts`: Helper utilities and formatting (3 tests)
- `src/lib/slot-engine/slot-generator.test.ts`: 15-minute slot generation, buffer calculation, and operating hour boundaries (5 tests)
- `src/lib/slot-engine/concurrency.test.ts`: Real PostgreSQL concurrency collision simulation (1 test)

### Playwright End-to-End Tests
```bash
npx playwright test
```
Executes complete end-to-end user journeys on simulated Mobile (Pixel 7) and Desktop Chrome:
1. **Landing Page:** Verifies Accra/Kumasi/Tema locations, slogan, and featured shop.
2. **Public Booking Flow:** End-to-end service selection, barber pick, slot hold, payment selection, and QR boarding pass verification.
3. **Owner Dashboard:** Timeline rendering, chair status, walk-in seat assignment.
4. **Platform Admin:** Developer console metrics, shop suspension controls, and drilldown.

### Google Lighthouse Mobile Audit
Audit performed on the mobile booking portal (`/book/gentlemens-cut`):
- **Accessibility:** `100 / 100` (WCAG 2.2 AA compliant contrast, aria attributes, scalable viewport)
- **SEO:** `100 / 100` (Semantic HTML, meta titles, descriptions, viewport tags)
- **Best Practices:** `96 / 100` (HTTPS-ready, modern formats, zero security deprecations)
- **Performance:** `76 / 100` (Local dev server)

Audit reports are archived in `docs/e2e/report.html` and `docs/e2e/report.json`.

---

## 📁 Project Directory Layout

```
trimly/
├── docs/e2e/                  # Lighthouse reports & mobile/desktop screenshots
│   ├── 01_home_mobile.png
│   ├── 02_booking_services_mobile.png
│   ├── 03_booking_slots_mobile.png
│   ├── 04_booking_confirmation_mobile.png
│   ├── 05_owner_timeline_desktop.png
│   ├── 06_admin_console_desktop.png
│   ├── report.html            # Lighthouse Mobile HTML report (Score: 100/100/96/76)
│   └── report.json            # Lighthouse JSON audit dump
├── public/                    # PWA manifest, service worker, icons
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── app/                   # Next.js 16 App Router routes
│   │   ├── (auth)/            # /login, /signup, /auth/signout
│   │   ├── admin/             # Platform Developer Console (Martin)
│   │   ├── api/               # Serverless API routes (slots, hold, confirm, push, cron)
│   │   ├── book/[slug]/       # Public booking portal & /manage cancellation pass
│   │   ├── dashboard/         # Owner operations dashboard (timeline, services, staff, settings)
│   │   ├── onboard/           # 5-step shop onboarding wizard
│   │   └── staff/             # Individual barber chair schedule
│   ├── components/            # UI components, icons, navigation
│   ├── lib/
│   │   ├── notifications/     # Web Push (VAPID) and SMS notification dispatchers
│   │   ├── payments/          # Payment providers (Mock, Paystack, Hubtel)
│   │   ├── slot-engine/       # Slot matrix generator, hold manager, collision handler
│   │   └── supabase/          # Supabase client, server, and service-role helpers
│   └── types/                 # Database schema TypeScript types
├── supabase/
│   ├── migrations/            # SQL migrations with btree_gist exclusion constraints & RPCs
│   └── seed.sql               # Seed data for Gentlemen's Cut demo
├── tests/e2e/                 # Playwright end-to-end test suite
└── vitest.config.mts          # Vitest configuration with path aliases & test isolation
```

---

## 📄 License & Credits
Engineered for **Martin** (`moseiboakye@st.knust.edu.gh`).
Built with love for barbershops across Ghana 🇬🇭.
