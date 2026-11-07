# Cloudflare deployment

GxStyl's repository is `Martinosb/trimly`. This migration uses vinext and Cloudflare Workers, preserving the Next.js source and Supabase backend. The Worker is `gxstyl`, in account `45546e235b52054c97f2a1463bf9bcae`; its custom domains are `gxstyl.com` and `www.gxstyl.com`.

## Production configuration

Recover the **existing GxStyl production** values from Vercel. Do not substitute another Supabase project: its users, schema, and bookings must match this app. The connected Vercel API currently returns variable metadata without values.

Required for login, search, and booking:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_APP_URL=https://gxstyl.com`

Also preserve `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `MOCK_SMS_MODE`, and `MOCK_PAYMENT_MODE` from the original deployment, and any payment/SMS provider credentials that are actually enabled. Replacing VAPID keys invalidates existing push subscriptions. Do not commit production secrets or share them in chat.

Build-time public values belong in the ignored `.env.production` file. Put the runtime values into an ignored `.env.production.json` object for the deployment's `--secrets-file`. The service-role and VAPID private keys must never have a `NEXT_PUBLIC_` prefix. `.dev.vars` is ignored and can supply runtime credentials for local Worker previews.

## Build and preview

```sh
npm ci
npm run build:vinext
npm run start:vinext -- --port 4173
```

Builds succeed without credentials, but that output is for framework smoke testing only. Missing credentials leave search unavailable and prevent real authentication and bookings. Rebuild with the actual `NEXT_PUBLIC_*` values before production deployment.

`npm run dev` and `npm run build` retain the original Next.js workflow. `npm run dev:vinext` starts the Cloudflare development workflow. `npx cf workers types` regenerates ignored Worker binding types.

## Deployment and DNS cutover

1. Authenticate the local Cloudflare CLI (`npx cf auth login`), or securely supply a scoped `CLOUDFLARE_API_TOKEN`. The chat's Cloudflare connection does not automatically authenticate the local CLI.
2. Build with the real production public values and run `npx cf deploy --dry-run`. Inspect the target account, Worker, domains, and bindings.
3. Confirm the existing Supabase project's Auth URL configuration allows `https://gxstyl.com/auth/callback` and `https://www.gxstyl.com/auth/callback`, and set its Site URL to `https://gxstyl.com`. Preserve other intentional redirect URLs. Verify email links and the Google OAuth flow.
4. At cutover, remove only the conflicting website DNS records listed below; preserve any unrelated records. Deploy with `npx cf deploy --prebuilt --secrets-file .env.production.json`. The custom-domain configuration creates the appropriate Workers DNS records and certificates.
5. Verify HTTPS for both hosts, static JS/CSS and service worker assets, shop discovery, login/logout, owner/staff access, and a controlled booking/cancellation flow. Confirm redirect hosts and push/payment integrations match production settings.

The website DNS records observed on 2026-11-07 were:

| Host | Type | Value | Record ID |
| --- | --- | --- | --- |
| gxstyl.com | A | 76.76.21.21 | 3c1397499e6e04cf65c6cc2d215510b3 |
| www.gxstyl.com | CNAME | cname.vercel-dns.com | 889a3bf58b123fa5d348f96b2e9e0729 |

The zone ID is `cbf353616f4c56d62ccf95ab40368047`. These records were left intact while production credentials were unavailable. Cloudflare already manages the domain's authoritative nameservers.

No `vercel.json`, Vercel storage bindings, or repository cron schedule was found. The app contains `/api/cron/reminders`, but its previous external scheduler is unknown; this migration does not invent a schedule or call an endpoint that sends notifications. Vercel deployment deletion is separate from DNS cutover; keep the old deployment available until the replacement passes production checks.

## Validation at preparation time

The vinext compatibility scan reports 14 supported checks and no issues. The Worker production build, deployment dry-run, clean `npm ci`, and TypeScript check pass. The original Next.js development server also serves the homepage successfully. Public pages were tested in the local Worker runtime. The 11 database-independent tests pass. The database concurrency suite needs a local Supabase stack and was unavailable; it deliberately rejects production databases. Repository-wide lint has existing errors in application code; no application source was changed for the hosting migration.
