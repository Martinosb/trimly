Product name: **Trimly** — "the new way to get a beautiful cut". Use "Trimly" as the app title, package name, README heading and in UI copy.

You are building Trimly, described in ./PRD.md (source brief: ./requirements.pdf), in this directory (a git repo already linked to https://github.com/Martinosb/trimly, branch `main`).

Work like a senior product engineer and a senior product designer. **Do not take shortcuts**: no placeholder screens, no fake "coming soon" buttons, no skipped tests, no stubbed logic where the PRD asks for real behaviour (only payments/SMS providers may be mocked behind interfaces, and say so in the README). Aim for the best UI design a professional would ship.

---------------------------------------------------------------------
## PHASE 0 — DESIGN FIRST (do this now, then STOP)
---------------------------------------------------------------------
Use the **Stitch MCP (StitchMCP)** to design **every page of the app** before writing any app code:

1. Read ./DESIGN.md (Airbnb design system) and ./PRD.md. Create a Stitch project named "Trimly". Create/apply a Stitch design system from ./DESIGN.md (tokens: colors, type, radii, elevation, components) so all screens are consistent.
2. Generate **mobile-first** screens (also a desktop variant for dashboards) for ALL of:
   - **Marketing/landing** page + shop-owner sign-up / login
   - **Shop onboarding** wizard (shop details + slug, services, staff, hours, payment policy, share link)
   - **Public booking portal** `/book/[slug]`: shop home, service selection, staff selection (incl. "Any Available Staff"), date + live time-slot matrix, client details, payment choice (Pay now MoMo/card · Reserve & pay at shop · Deposit), confirmation, manage/cancel booking
   - **Owner dashboard**: live daily timeline per staff, booking detail drawer, manual/walk-in booking, services, staff (create profile + invite login), working hours & time off, payment policy, notifications settings, shop profile/share link
   - **Staff view**: my schedule today/upcoming
   - **Platform Admin (developer) console**: all shops (status, plan, created date, last active), shop detail, users, bookings/revenue/no-show stats, activity feed, suspend/reactivate shop
   - Empty states, loading skeletons, error states, PWA install prompt, notification permission prompt
3. Save the Stitch project id + screen ids/links in ./docs/design/STITCH.md and export screenshots/HTML into ./docs/design/.
4. **STOP after Phase 0.** Print a list of every screen with its Stitch link and wait. Do NOT start building the app. Martin will review and approve (or request changes) and then tell you to continue to Phase 1. If changes are requested, revise the Stitch screens.

---------------------------------------------------------------------
## PHASE 1 — BUILD (only after Martin approves the designs)
---------------------------------------------------------------------

### Stack (latest STABLE versions — verify with `npm view <pkg> version`, do not guess)
- **Next.js latest stable (16.x)**, App Router, TypeScript strict, React latest stable
- **Tailwind CSS latest stable**
- **shadcn/ui** for all components, themed to ./DESIGN.md tokens (Airbnb) and matching the approved Stitch screens pixel-closely
- Supabase (local) for Postgres, Auth, Realtime, Storage
- Node is via nvm: `export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"`

### Performance & UX requirements
- Fast pages: server components by default, streaming, `loading.tsx` **skeletons on every route** (skeletons must match final layout, no layout shift), optimized images (`next/image`), font optimization, minimal client JS, route prefetching, caching where safe. Run Lighthouse via chrome-devtools MCP; target ≥ 90 Performance/Accessibility/Best-Practices/SEO on mobile for the booking portal.
- **Mobile-first / mobile-optimized**: designed for phones first (thumb-reachable actions, bottom sheets, large tap targets ≥ 44px, sticky primary CTA); verify at 360×800 and 390×844, then tablet and desktop.
- **PWA with notifications**: web app manifest, icons (192/512/maskable), service worker (offline shell + cache strategy), installable, install prompt UI, **Web Push** notifications (VAPID keys, subscription table, service-worker `push` + `notificationclick`) for: new booking (owner/staff), booking confirmation (client, if subscribed), 1-hour reminder. Generate VAPID keys locally into `.env.local`. Keep SMS/WhatsApp provider interface (mock impl, Arkesel plug-in point documented).

### Backend — local Supabase is ALREADY RUNNING (started by Martin with `supabase start`)
- Project URL `http://127.0.0.1:54321` · DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres` · Studio `http://127.0.0.1:54323` · Mailpit (auth emails) `http://127.0.0.1:54324`
- Get the publishable/secret keys by running `supabase status` in this directory and put them in `.env.local`. **Never commit `.env*` or keys** (add to `.gitignore` first). Commit only `.env.example`.
- ⚠ Your configured `supabase-mcp-server` is pinned to a **cloud** project (`--project-ref ...`). **Do NOT use it, and never touch that project.** Work only against the local stack: use the `supabase` CLI (`supabase migration new`, `supabase db reset`, `supabase gen types typescript --local`) and `psql` against the local DB URL above. The local stack also exposes an MCP at `http://127.0.0.1:54321/mcp` if you want to add it.
- Schema via migrations in `./supabase/migrations` and demo data in `./supabase/seed.sql`. Must include: multi-tenant `shops` with unique `slug`; staff, services, staff_services, hours/time-off, bookings, payments, push_subscriptions, notifications, `platform_admins`; RLS on everything (tenant isolation; staff see only their own bookings; public booking via safe RPC/edge function, not open table access); the **Postgres exclusion constraint** `EXCLUDE USING gist (staff_id WITH =, tstzrange(start_at, end_at) WITH &&) WHERE status IN ('pending','confirmed')` (needs `btree_gist`); short-lived slot holds that expire; "Any Available" assignment done atomically in the DB.
- Realtime for the owner's live schedule.
- Reminder job: pg_cron or an edge function scheduled 1 hour before each slot.

### Platform Admin (Martin = the developer)
A `/admin` area gated by `platform_admins` (seed Martin's account: moseiboakye@st.knust.edu.gh). Lets Martin see who uses Trimly: every shop (name, slug, owner, created, last activity, #staff, #bookings, revenue, no-show rate), per-shop drilldown, platform-wide metrics and charts, recent signups/activity feed, and suspend/reactivate a shop (suspended shops' public links show a friendly unavailable page). Fully RLS-protected — normal owners must never reach it.

### Build order (verify each step before moving on)
1. Repo hygiene: `.gitignore`, `.env.example`, README skeleton, project scaffold, shadcn init with Airbnb tokens.
2. DB: migrations + seed (demo shop `gentlemens-cut`, 3 staff, 5 services) + RLS + exclusion constraint. Test with `supabase db reset`.
3. **Slot engine + conflict logic** — unit tests (overlap-aware, per-staff blocking, Any Available, holds/expiry) **and a real concurrency test against the local DB** proving two simultaneous bookings on one slot → exactly one succeeds.
4. Auth (owner + staff + platform admin), onboarding wizard.
5. Public booking portal `/book/[slug]` (matches approved Stitch screens).
6. Owner dashboard, staff view, settings.
7. Payments (mock MoMo/card provider behind interface; deposit logic; webhook-style confirmation flow).
8. PWA + Web Push + reminders.
9. Platform Admin console.
10. Polish: skeletons, empty/error states, accessibility, Lighthouse pass.

### Testing — end to end, for real
- Unit tests (Vitest) + DB tests + E2E. Use the **chrome-devtools MCP** (Chrome on `http://127.0.0.1:9222`; if it isn't up, start Chrome with `--remote-debugging-port=9222`) to drive the running app against the local Supabase: sign up as owner, create a shop/services/staff, book as a client on a phone-sized viewport, confirm the slot disappears for that barber only, confirm a second simultaneous booking fails, check the owner timeline updates in realtime, check the staff view is scoped, check the admin console, check console/network for errors, take screenshots into `./docs/e2e/`. Also add Playwright specs for the same flows so they can re-run in CI.
- Nothing is "done" until typecheck, lint, unit tests, DB tests and the E2E flow pass.

### Git workflow — gradual commits, push when green
- Commit **small and often**, one logical step per commit, Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- **After each step's tests pass, push straight to GitHub** (`git push origin main`). Never push failing or untested work; never commit secrets. Do not force-push or rewrite history.
- Keep README.md current: what Trimly is, how to run (`supabase start`, `npm run dev`, `supabase db reset`), env vars, testing, what is mocked (payments/SMS providers), and how to plug in Paystack/Hubtel + Arkesel.

### When finished
Print a summary: what works, what is mocked, test results, Lighthouse scores, and any open questions from the PRD.

Work autonomously through Phase 1 without asking questions, but **do not begin Phase 1 until Martin approves the Phase 0 designs.**
