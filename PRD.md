# PRD — Trimly: Multi-Tenant Barber & Salon Booking SaaS (Ghana)

**Source:** `requirements.pdf` (brief from Chris, received 2026-09-19) · **Owner:** Martin (solo) · **Deadline:** Fri 2026-09-25
**Name:** Trimly (public links: `cerkyl.com/book/<shop-slug>`)
**Context:** Sister product to the existing hostel-booking SaaS; reuse its multi-tenant infra where possible.

## 1. Problem & Goal
Clients of barbershops and salons in Ghana lose time to long walk-in queues; owners struggle to coordinate staff and lose money to no-shows.
**Goal:** every shop registers, gets a unique public booking link, and clients book a specific staff member (or "any available") in a live slot matrix, with optional MoMo/card payment or deposit. Owners and staff manage the day from a mobile-friendly dashboard.

## 2. Users
| Persona | Needs |
|---|---|
| **Client** (no account required) | Fast mobile booking, see prices, pick barber/stylist, pay via MoMo, get SMS/WhatsApp confirmation + reminder |
| **Shop Owner / Admin** | Register shop, manage services, staff, hours, payment policy; see full live schedule; protect against no-shows |
| **Staff** (barber/stylist/nail tech) | Simple login, see *only their own* schedule for today |
| **Platform Admin** (Martin/Chris) | Onboard/monitor tenants, subscription/commission (v2) |

## 3. Scope

### 3.1 Core SaaS architecture (P0)
- **Tenant = Shop.** Unique slug → public link `/book/<slug>`; slug validated unique, URL-safe, editable once.
- Strict tenant isolation on all data (shop_id on every row; row-level security).
- **Staff profiles:** owner creates employees (name, role: Barber/Stylist/Nail Technician, photo, services offered, working hours, days off). Staff get their own login.

### 3.2 Public client booking portal (P0)
1. **Service selection** — menu with name, duration, price, category (Haircut, Hair Dyeing, Braiding, Manicure…).
2. **Staff selection** — pick a specific person, or **"Any Available Staff"** (auto-assigned at booking).
3. **Real-time slot matrix** — day picker + available times for the chosen service duration and staff (or union of all staff for "Any").
4. **Conflict logic (critical)** — if Kojo is booked 2:00–2:45 PM, that window is blocked for Kojo only; other staff remain bookable. Overlap-aware (uses service duration + optional buffer), not just start-time equality.
5. **Booking options** (per shop policy, owner-configurable):
   - **Book & Pay Instantly** — MTN MoMo, Telecel Cash, AT Money, and cards.
   - **Reserve & Pay at Shop** — slot is locked, payment on arrival.
   - **Deposit / part-payment** (no-show protection) — fixed amount or % collected via MoMo to confirm slot.
6. Client details: name, phone (required), optional email/notes. Confirmation page with booking reference + add-to-calendar + cancel/reschedule link.

### 3.3 Shop owner & staff dashboard (P0)
- **Live schedule feed** — daily timeline (columns per staff, rows per time) showing client, service, status (Pending/Confirmed/Arrived/Completed/No-show/Cancelled).
- **Owner actions:** create walk-in/manual booking, reschedule, cancel, mark arrived/no-show, block time off.
- **Staff view** — mobile-responsive, own bookings only, today/upcoming.
- **Settings:** shop profile, hours, services & prices, staff, payment policy (instant / pay-at-shop / deposit %), cancellation window.

### 3.4 Notifications (P0)
- **Confirmation** to client immediately after booking (SMS; WhatsApp API where available).
- **Reminder 1 hour before** the slot (scheduled job).
- Owner/staff alert on new booking (in-app + SMS optional).
- Provider: Arkesel SMS (already used in WHISPER) as default; WhatsApp Business API as enhancement.

### 3.5 Out of scope for v1
Platform subscription billing, loyalty/promos, reviews, multi-branch shops, native mobile apps, custom domains/subdomains (path-based links only).

## 4. Technical focus points (from brief)

### 4.1 Time-slot conflict logic
- Store bookings as `staff_id, start_at, end_at (timestamptz)`; prevent double-booking **at the database level**, not only in app code:
  Postgres exclusion constraint `EXCLUDE USING gist (staff_id WITH =, tstzrange(start_at,end_at) WITH &&) WHERE status IN ('pending','confirmed')`.
- Slot generation = staff working hours − existing bookings − time-off − buffer, computed server-side.
- **Temporary hold:** selecting a slot creates a 5–10 min `pending` hold; expires if unpaid (releases slot). Concurrent attempts on the same slot → one succeeds, other gets a clean "slot just taken" message.
- "Any Available" assigns the least-loaded free staff inside the same transaction.
- All times stored UTC, displayed in Africa/Accra.

### 4.2 No-show protection
- Deposit via MoMo gateway (Paystack / Hubtel / Flutterwave — pick one with MTN, Telecel, AT + card support; **decision needed**).
- Webhook-confirmed payment flips booking `pending → confirmed`; unpaid holds expire.
- Owner-set policy: deposit amount/%, refundable window, forfeited on no-show.

## 5. Suggested stack (reuse hostel SaaS where possible)
Next.js (App Router) + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS, Realtime for live schedule, pg_cron/Edge Functions for reminders) · Payments: Paystack/Hubtel · SMS: Arkesel · Deploy: Vercel.

## 6. Data model (v1)
`shops` (id, slug, name, owner_id, hours, payment_policy, deposit_rule) ·
`staff` (id, shop_id, user_id, name, role, photo, active) ·
`staff_hours` / `time_off` ·
`services` (id, shop_id, name, category, duration_min, price) ·
`staff_services` (staff_id, service_id) ·
`bookings` (id, shop_id, staff_id, service_id, client_name, client_phone, start_at, end_at, status, payment_status, ref) ·
`payments` (id, booking_id, provider, amount, status, provider_ref) ·
`notifications` (id, booking_id, type, channel, status, scheduled_for).
Roles: `owner`, `staff` (RLS: staff sees own bookings only).

## 7. Key flows
1. **Owner onboarding:** sign up → shop details → slug → services → staff → hours → payment policy → share link.
2. **Client booking:** open link → service → staff/any → date/time → details → pay/reserve → confirmation SMS → reminder T-1h.
3. **Staff day:** log in → today's list → mark arrived/complete.

## 8. Success metrics
- Double-bookings = 0 (enforced by DB constraint, verified by concurrency test).
- Booking completed in < 60 s on mobile.
- No-show rate reduced for shops using deposits.
- Reminder delivered ≥ 95% within 1h ± 5 min.

## 9. Acceptance criteria (MVP demo for Friday)
- [ ] Shop registers and receives working `/book/<slug>` link.
- [ ] Owner adds services and ≥ 2 staff with hours.
- [ ] Client books via the link; booked staff slot disappears, other staff's stays open.
- [ ] "Any Available" assigns a free staff member.
- [ ] Two simultaneous bookings on one slot → exactly one succeeds.
- [ ] Reserve & Pay-at-Shop works; deposit/MoMo flow works in sandbox.
- [ ] Owner sees live daily timeline; staff sees only own schedule.
- [ ] Confirmation SMS sent; 1-hour reminder scheduled.

## 10. Open questions
1. Which payment gateway does Chris want (Paystack vs Hubtel vs Flutterwave)? Does the hostel SaaS already use one?
2. Can we reuse the hostel project's Supabase project/auth, or new tenant instance?
3. WhatsApp API in v1, or SMS only?
4. Deposit: fixed vs percentage; refund rules on cancellation?
5. Commission/subscription model for tenants (post-v1)?
6. Solo build, deadline Fri — confirm the demo scope above is acceptable.
