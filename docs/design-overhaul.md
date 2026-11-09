# Trimly design and engineering refresh

The current redesign supersedes the old GxStyl/Airbnb colour direction in PRODUCT.md and DESIGN.md. Use a warm light canvas (#faf9f6), forest green (#17634b), restrained borders, readable body text, and clear keyboard focus. Public pages and operational screens share semantic tokens. The landing page keeps discovery above explanatory content and does not invent shops, reviews, ratings, or usage statistics.

## Sources

HyperUI components adapted from https://github.com/Martinosb/hyperui:
- public/components/marketing/banners/2.html: constrained copy, heading and paired actions.
- Application side menus: compact icon links and selected state.
- Marketing headers/footers: responsive navigation structure.

HyperUI is MIT licensed; its copyright and license are preserved in licenses/hyperui.txt. No runtime dependency on the component catalogue is required.

The replacement photograph is downloaded locally from https://images.unsplash.com/photo-1503951914875-452162b0f3f1. Usage is under the Unsplash license, https://unsplash.com/license, rather than an open-source software license. It depicts a barber trimming a customer’s beard and is decorative editorial photography, not a claim about a listed Ghanaian shop. Next Image serves responsive optimized sizes. The previous generated hero assets were removed. The scissors app icon is an original SVG.

## Functional changes

- Booking management is available immediately after confirmation. Download remains recommended for offline check-in.
- Dashboard navigation identifies the current route with aria-current on desktop and mobile.
- Password login and OAuth share trusted database role routing, including staff, owners, administrators, and new accounts. No email-specific client routing remains. Independent owner/staff lookups run concurrently.
- Branding is consistent across metadata, notifications, pass rendering, terms, privacy, onboarding, and the installable app.

## Validation boundary

Local tests cover routing precedence and rejected external redirects. Existing validation, location, and slot-generation tests remain in place. scripts/review-ui.mjs checks desktop/mobile layout, search, image loading, anchors, the unconfigured sign-in fallback, and JavaScript errors with an explicitly mocked empty shop API. Screenshots are generated under docs/review-*.png.

No Supabase credentials are configured in this environment. Database-backed bookings, concurrency, payments, SMS/push delivery, and authenticated owner/staff/admin workflows require a configured staging environment before release. Existing e2e specs assume seeded shops and old interface wording and need updating against that environment. This pass does not certify production readiness or claim that every existing backend issue is fixed.
