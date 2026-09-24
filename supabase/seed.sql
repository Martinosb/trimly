-- Trimly Seed Data

-- 1. Martin's Platform Admin Record
INSERT INTO platform_admins (id, email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'moseiboakye@st.knust.edu.gh')
ON CONFLICT (email) DO NOTHING;

-- 2. Demo Shop: Gentlemen's Cut
INSERT INTO shops (
  id,
  name,
  slug,
  tagline,
  description,
  address,
  city,
  phone,
  email,
  instagram,
  deposit_type,
  deposit_value,
  allow_pay_at_shop,
  cancellation_hours,
  is_suspended
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Gentlemen''s Cut',
  'gentlemens-cut',
  'Accra''s Premier Grooming & Styling Experience',
  'Gentlemen''s Cut brings refined barbering to Osu, Accra. From precision fades and tailored beard sculpting to reviving hot towel treatments, our master barbers ensure you leave looking sharp and feeling confident.',
  '14 Oxford Street, Osu, Accra',
  'Accra',
  '+233 24 123 4567',
  'info@gentlemenscut.com',
  '@gentlemenscut_gh',
  'fixed',
  30.00,
  true,
  2,
  false
) ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone;

-- 3. Staff (3 Barbers)
INSERT INTO staff (
  id,
  shop_id,
  name,
  role,
  phone,
  email,
  bio,
  is_active
) VALUES 
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Kojo Mensah',
  'Master Barber & Founder',
  '+233 24 999 1111',
  'kojo@gentlemenscut.com',
  '10+ years mastering skin fades, beard architecture, and classic grooming.',
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Kwame Asante',
  'Senior Stylist',
  '+233 24 999 2222',
  'kwame@gentlemenscut.com',
  'Specialist in modern texturing, crisp razor outlines, and creative taper designs.',
  true
),
(
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'Emmanuel Osei',
  'Barber & Scalp Specialist',
  '+233 24 999 3333',
  'emmanuel@gentlemenscut.com',
  'Certified scalp therapist and precision cutter. Known for gentle hot-towel shaves.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Services (5 Services)
INSERT INTO services (
  id,
  shop_id,
  name,
  description,
  duration_min,
  price,
  category,
  is_popular,
  is_active
) VALUES
(
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'The Executive Cut',
  'Precision scissor or clipper haircut, razor neck cleanup, invigorating shampoo wash, and refreshing hot towel finish.',
  45,
  120.00,
  'Haircut',
  true,
  true
),
(
  '33333333-3333-3333-3333-333333333332',
  '11111111-1111-1111-1111-111111111111',
  'Beard Sculpt & Razor Lineup',
  'Sculpted beard trimming, conditioning beard oil, and crisp straight-razor edge finish.',
  30,
  70.00,
  'Beard',
  true,
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'The Complete Package',
  'Signature haircut, full beard sculpt, exfoliating facial wash, black peel-off mask, and scalp massage.',
  75,
  180.00,
  'Combo',
  true,
  true
),
(
  '33333333-3333-3333-3333-333333333334',
  '11111111-1111-1111-1111-111111111111',
  'Kids Classic Cut',
  'Gentle, patience-focused stylish haircut for boys and young gentlemen under 12.',
  30,
  60.00,
  'Kids',
  false,
  true
),
(
  '33333333-3333-3333-3333-333333333335',
  '11111111-1111-1111-1111-111111111111',
  'Scalp Therapy & Razor Shave',
  'Deep scalp clarifying scrub, traditional hot towel lather razor shave, and cooling aftershave balm.',
  45,
  100.00,
  'Shave',
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Staff Services (All barbers offer all 5 services)
INSERT INTO staff_services (staff_id, service_id)
SELECT s.id, sv.id
FROM staff s
CROSS JOIN services sv
WHERE s.shop_id = '11111111-1111-1111-1111-111111111111'
  AND sv.shop_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- 6. Working Hours (Monday to Saturday: days 1 to 6)
-- Kojo Mensah (08:30 - 18:30 Mon-Sat)
INSERT INTO staff_hours (staff_id, day_of_week, start_time, end_time, is_working)
VALUES
  ('22222222-2222-2222-2222-222222222221', 1, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 2, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 3, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 4, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 5, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 6, '08:30', '18:30', true),
  ('22222222-2222-2222-2222-222222222221', 0, '10:00', '16:00', false)
ON CONFLICT (staff_id, day_of_week) DO UPDATE 
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_working = EXCLUDED.is_working;

-- Kwame Asante (09:00 - 19:30 Mon-Sat)
INSERT INTO staff_hours (staff_id, day_of_week, start_time, end_time, is_working)
VALUES
  ('22222222-2222-2222-2222-222222222222', 1, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 2, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 3, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 4, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 5, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 6, '09:00', '19:30', true),
  ('22222222-2222-2222-2222-222222222222', 0, '10:00', '16:00', false)
ON CONFLICT (staff_id, day_of_week) DO UPDATE 
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_working = EXCLUDED.is_working;

-- Emmanuel Osei (10:00 - 20:00 Mon-Sat, Sunday 12:00 - 18:00)
INSERT INTO staff_hours (staff_id, day_of_week, start_time, end_time, is_working)
VALUES
  ('22222222-2222-2222-2222-222222222223', 1, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 2, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 3, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 4, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 5, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 6, '10:00', '20:00', true),
  ('22222222-2222-2222-2222-222222222223', 0, '12:00', '18:00', true)
ON CONFLICT (staff_id, day_of_week) DO UPDATE 
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_working = EXCLUDED.is_working;

-- 7. Sample Initial Bookings for Demo Showcase
INSERT INTO bookings (
  id,
  shop_id,
  staff_id,
  service_id,
  client_name,
  client_phone,
  client_email,
  client_notes,
  start_at,
  end_at,
  status,
  payment_status,
  payment_method,
  price,
  deposit_amount,
  cancellation_code
) VALUES 
(
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '33333333-3333-3333-3333-333333333331',
  'Yaw Boateng',
  '+233 24 555 7788',
  'yaw.boateng@example.com',
  'Low skin fade on sides, please trim moustache lightly.',
  (CURRENT_DATE + TIME '10:00:00')::TIMESTAMPTZ,
  (CURRENT_DATE + TIME '10:45:00')::TIMESTAMPTZ,
  'confirmed',
  'deposit_paid',
  'momo_mtn',
  120.00,
  30.00,
  'YAW789'
),
(
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333332',
  'Kofi Mensah',
  '+233 20 888 4433',
  'kofi.mensah@example.com',
  'Full beard shape-up with razor finish.',
  (CURRENT_DATE + TIME '11:00:00')::TIMESTAMPTZ,
  (CURRENT_DATE + TIME '11:30:00')::TIMESTAMPTZ,
  'confirmed',
  'paid',
  'card',
  70.00,
  70.00,
  'KOF456'
)
ON CONFLICT (id) DO NOTHING;
