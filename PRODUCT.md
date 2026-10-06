# Trimly / GxStyl

Trimly is a multi-tenant barber and grooming shop booking application for Ghana. The current UI uses the GxStyl name. The app is intended to accept shops nationwide from day one, including cities, towns, and villages.

## Nationwide locations

Owners choose one of Ghana’s 16 regions, enter their locality freely, and provide an area, address, or landmark. They can optionally add a shop entrance map pin using browser geolocation, an interactive map, or manual coordinates. Permission is requested only after an explicit action; owners are reminded to use current location only at their shop. They confirm location details before continuing, and changes require confirmation again. The same controls are available in shop settings.

Customers browse public active shops without signing in or granting location permission. They search by shop name, town, area, or landmark, filter by region, and page through results. Optional “Near me” searches use coordinates transiently and show pinned shops within a selected radius, ordered by straight-line distance. Directions use a shop pin when available and the written Ghana address otherwise.

The existing `shops.city` field stores locality for backward compatibility. Region and coordinates are additive, nullable fields for legacy shops. Known legacy city regions are backfilled. Shop addresses and pins are public business information; customer search coordinates are not saved to the database or offline cache.

## Implementation boundary

The existing white canvas, #ff385c primary color, rounded outlined controls, and typography remain authoritative. This feature extends the existing onboarding, settings, and discovery flows; it does not redesign the brand.

The location migration must be applied before deploying the feature. On 2026-10-06, the linked TRIMLY production project was verified to contain migration 20261006174621, and public discovery queries succeeded. Browser screenshot fixtures such as “Village Cuts” are synthetic test data and are not production listings.
