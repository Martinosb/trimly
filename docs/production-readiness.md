# Production launch update

The app now defaults to dark styling with original responsive desktop and mobile hero photography. Its landing page explains the customer journey, connects to real shop discovery, and offers a clear business signup path. Hero motion respects reduced-motion preferences; private pages and booking details are excluded from service-worker caching.

The five listings confirmed by the owner as tests were suspended, rather than deleted. A private backup was saved outside the repository. Public search excludes suspended shops, and their direct booking pages are unavailable. New shops start with no invented services or team members; owners must provide actual details.

## App protections

- Owner, staff, onboarding, and admin pages validate sessions on the server; shop selection never falls back to another shop or browser storage.
- Admin access requires an explicit `platform_admins.user_id` membership.
- Reservation input is validated and checked against available slots and shop policy.
- Confirmation requires the reservation's private reference, an unexpired hold, and an available shop. It cannot accept client-reported payments.
- Online checkout is unavailable until a complete verified provider flow is integrated. Customers reserve and pay the shop directly where the shop permits it.
- Unconfigured SMS is recorded as unavailable/failed; it never simulates delivery. Customer SMS contents and phone numbers are not logged.
- Push subscriptions require an authorised team user or a valid booking capability, and supported HTTPS push endpoints. Cron notifications require `CRON_SECRET`.
- Booking API requests have Cloudflare rate limits, cross-origin checks, and body-size header checks.
- Customer booking lookup uses a server endpoint checked against the shop and private reference.

## Required database update

Apply `supabase/migrations/20261107234556_production_access_controls.sql` to **GxStyl's existing project `wehftvvaavkhobqbrkjc`**, after deploying this app version. It removes broad public writes/reads, restricts privileged booking RPCs to the service role, protects shop ownership/suspension, and makes database confirmation atomic and unpaid-only.

The connected Supabase integration cannot access that project. Its permission check failed; the migration has **not** been applied to production. The original schema includes overly broad policies and public privileged functions. Frontend and API changes cannot repair direct database access; this is a release blocker for real customer data.

The owner can run the migration in that project's SQL Editor, or connect this chat to the correct Supabase account so it can be applied and verified. Do not apply it to the unrelated APPS STUDIO database.

The migration was applied successfully to an isolated PostgreSQL 17 database alongside the existing migrations. `tests/sql/bootstrap.sql` and `tests/sql/production-access.sql` contain **local-only** test setup/fixtures. Tests check anonymous table/RPC access, owner isolation, owner updates, protected administrative fields, and valid/duplicate/fake-paid confirmation behavior. Never run test fixtures against production.

## Remaining launch requirements

- Apply and verify the production database migration, then run Supabase security advisors.
- Verify email verification/reset and Google OAuth redirect settings with a real owner session.
- Online payments, SMS, and push require their real provider setup before being advertised. Booking references remain available on screen without those integrations.
- Automatic GitHub deployment is not configured; deploy explicitly with the Cloudflare CLI and production secrets.
- Live end-to-end booking must be checked with an actual participating shop, its hours, and real services before accepting customers. No production customer bookings or payments were created during this update.

## Release verification

Deployed Worker version: `961e1546-6f9a-4d39-bf86-0a1226f18259`. Live Chromium checks verified both desktop and mobile imagery, dark styling, no horizontal overflow, reduced-motion behaviour, an empty directory, and redirects for anonymous visits to private pages. Suspended test-shop booking pages reject booking. Unit tests and separate app/Worker type checks pass. Repository lint has no errors (existing unused-variable and hook warnings remain).

`npm test` runs database-independent tests. `npm run test:integration` explicitly opts into the concurrency test and requires a local Supabase stack; the test refuses production URLs. The database migration's PostgreSQL tests are separate from the app unit tests.

Live API checks reject invalid booking/payment payloads (400), cross-origin mutations (403), and unauthorised reminder execution (401). A live burst of invalid lookup requests reached the Cloudflare rate limit (429). Rate limits are approximate and local to Cloudflare locations, rather than a strict global quota. These checks created no bookings.
