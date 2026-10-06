# Activating nationwide locations

Production status (2026-10-06): the linked TRIMLY project contains migration `20261006174621`. `supabase db push --linked` confirmed the database is up to date, and live public discovery queries succeeded.

Apply `supabase/migrations/20261006174621_nationwide_shop_locations.sql` to the intended Supabase project before deploying this version. It adds region and coordinates, backfills regions for Accra, Tema, Kumasi, and Takoradi, removes the Accra locality default, and adds the paginated `discover_shops` function. It preserves existing shop IDs, addresses, localities, and booking links.

The function uses invoker privileges and existing row-level access policies. Public results exclude suspended shops. Latitude and longitude must either both be null or both be valid; region must be one of Ghana’s 16 regions when present. Existing shops with an unknown region keep their locality and can set a region in settings.

After applying, verify public discovery:

```sql
select id, name, city, region from public.discover_shops();
select * from public.discover_shops('', '', 5.6037, -0.1870, 25);
```

Then register a test shop in a town outside the former four-city list, confirm its location, update it in settings, search by landmark and region, and check directions. Test denying location permission and removing a pin. A denied permission must never block registration or browsing.

Leaflet loads only when the map is opened. Map tiles come from OpenStreetMap with visible attribution; GPS, typed coordinates, and written location details remain usable if tiles fail to load. Directions open Google Maps. Review the OpenStreetMap tile usage policy before scaling traffic, and configure a production tile provider if needed.

Nearby distances are straight-line estimates, not travel distances. Only pinned shops appear in nearby results. Customer coordinates are used for the current query, excluded from service-worker caching, and not persisted to the database.

Verification during implementation: production build and TypeScript passed; local PostgreSQL migration checks covered legacy backfill, filters, distances, pagination, constraints, suspended shops, and invoker row-level security. Browser discovery tests use synthetic responses. A subsequent live check verified the production location columns and both public and nearby discovery queries.
