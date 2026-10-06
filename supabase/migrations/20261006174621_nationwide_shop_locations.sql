-- Retain city as the locality field, preserving existing shop records and booking links.
ALTER TABLE public.shops
  ADD COLUMN region text,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD CONSTRAINT shops_region_valid CHECK (region IS NULL OR region IN (
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
    'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
  )),
  ADD CONSTRAINT shops_coordinates_valid CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  );
ALTER TABLE public.shops ALTER COLUMN city DROP DEFAULT;
UPDATE public.shops SET region = CASE lower(trim(city))
  WHEN 'accra' THEN 'Greater Accra' WHEN 'tema' THEN 'Greater Accra'
  WHEN 'kumasi' THEN 'Ashanti' WHEN 'takoradi' THEN 'Western' END
WHERE lower(trim(city)) IN ('accra', 'tema', 'kumasi', 'takoradi');

-- Invoker rights preserve existing row-level access policies. Customer coordinates
-- are used for this query only; they are never persisted.
CREATE FUNCTION public.discover_shops(
  search_text text DEFAULT '', search_region text DEFAULT '',
  user_lat double precision DEFAULT NULL, user_lon double precision DEFAULT NULL,
  radius_km double precision DEFAULT 25, page_offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, name text, slug text, tagline text, address text, city text, region text,
  latitude double precision, longitude double precision, distance_km double precision, total_count bigint
) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH located AS (
    SELECT s.id, s.name, s.slug, s.tagline, s.address, s.city, s.region, s.latitude, s.longitude,
      CASE WHEN user_lat BETWEEN -90 AND 90 AND user_lon BETWEEN -180 AND 180
        AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
      THEN 6371 * 2 * asin(sqrt(least(1.0,
        power(sin(radians(s.latitude - user_lat) / 2), 2)
        + cos(radians(user_lat)) * cos(radians(s.latitude)) * power(sin(radians(s.longitude - user_lon) / 2), 2)
      ))) END AS distance_km
    FROM public.shops s
    WHERE s.is_suspended = false
      AND (coalesce(search_region, '') = '' OR s.region = search_region)
      AND (coalesce(trim(search_text), '') = '' OR position(lower(trim(search_text)) IN
        lower(concat_ws(' ', s.name, s.city, s.address, s.region))) > 0)
  ), matched AS (
    SELECT * FROM located WHERE (user_lat IS NULL AND user_lon IS NULL)
      OR distance_km <= least(greatest(radius_km, 1), 200)
  )
  SELECT matched.*, count(*) OVER () FROM matched
  ORDER BY distance_km ASC NULLS LAST, name ASC, id ASC
  LIMIT 12 OFFSET greatest(page_offset, 0);
$$;
REVOKE ALL ON FUNCTION public.discover_shops(text, text, double precision, double precision, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discover_shops(text, text, double precision, double precision, double precision, integer) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
