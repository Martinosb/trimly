-- Trimly Seed Data

-- 0. Demo Auth Users in auth.users & auth.identities (Password: Password123!)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES 
(
  'c2ce3a13-0505-495a-869a-c713a5494087',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'info@gentlemenscut.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Gentlemen''s Cut Owner"}',
  now(),
  now()
),
(
  'c2a7a616-bf5c-498f-8e2c-6fc3ff63a6eb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'moseiboakye@st.knust.edu.gh',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Martin Osei Boakye"}',
  now(),
  now()
),
(
  '4da0b933-1e2b-4a12-9602-10166b354407',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'kojo@gentlemenscut.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Kojo Mensah"}',
  now(),
  now()
),
(
  '71e6f017-7210-4829-99ab-76ac623edb90',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'kwame@gentlemenscut.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Kwame Asante"}',
  now(),
  now()
),
(
  '82dae066-bac0-454f-b914-a4e5e1cbd0ca',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emmanuel@gentlemenscut.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Emmanuel Osei"}',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'f164f17f-6bcd-443c-a2e9-e267397c2b07',
  'c2ce3a13-0505-495a-869a-c713a5494087',
  jsonb_build_object('sub', 'c2ce3a13-0505-495a-869a-c713a5494087', 'email', 'info@gentlemenscut.com'),
  'email',
  'c2ce3a13-0505-495a-869a-c713a5494087',
  now(),
  now(),
  now()
),
(
  'd7d96c36-0c60-47ba-9b6d-e8cbb2d9e073',
  'c2a7a616-bf5c-498f-8e2c-6fc3ff63a6eb',
  jsonb_build_object('sub', 'c2a7a616-bf5c-498f-8e2c-6fc3ff63a6eb', 'email', 'moseiboakye@st.knust.edu.gh'),
  'email',
  'c2a7a616-bf5c-498f-8e2c-6fc3ff63a6eb',
  now(),
  now(),
  now()
),
(
  '219aefd6-a6bd-4a41-a06b-de52e4c30fc8',
  '4da0b933-1e2b-4a12-9602-10166b354407',
  jsonb_build_object('sub', '4da0b933-1e2b-4a12-9602-10166b354407', 'email', 'kojo@gentlemenscut.com'),
  'email',
  '4da0b933-1e2b-4a12-9602-10166b354407',
  now(),
  now(),
  now()
),
(
  '7ff01cef-c4b7-4e38-be7a-aa1bb25559a4',
  '71e6f017-7210-4829-99ab-76ac623edb90',
  jsonb_build_object('sub', '71e6f017-7210-4829-99ab-76ac623edb90', 'email', 'kwame@gentlemenscut.com'),
  'email',
  '71e6f017-7210-4829-99ab-76ac623edb90',
  now(),
  now(),
  now()
),
(
  '84d4772d-1fa5-4943-acfb-353f25829f41',
  '82dae066-bac0-454f-b914-a4e5e1cbd0ca',
  jsonb_build_object('sub', '82dae066-bac0-454f-b914-a4e5e1cbd0ca', 'email', 'emmanuel@gentlemenscut.com'),
  'email',
  '82dae066-bac0-454f-b914-a4e5e1cbd0ca',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 1. Martin's Platform Admin Record
INSERT INTO platform_admins (id, user_id, email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'c2a7a616-bf5c-498f-8e2c-6fc3ff63a6eb', 'moseiboakye@st.knust.edu.gh')
ON CONFLICT (email) DO UPDATE
SET user_id = EXCLUDED.user_id;

-- 2. Demo Shop: Gentlemen's Cut
INSERT INTO shops (
  id,
  owner_id,
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
  'c2ce3a13-0505-495a-869a-c713a5494087',
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
SET owner_id = EXCLUDED.owner_id,
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone;

-- 3. Staff (3 Barbers)
INSERT INTO staff (
  id,
  shop_id,
  user_id,
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
  '4da0b933-1e2b-4a12-9602-10166b354407',
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
  '71e6f017-7210-4829-99ab-76ac623edb90',
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
  '82dae066-bac0-454f-b914-a4e5e1cbd0ca',
  'Emmanuel Osei',
  'Barber & Scalp Specialist',
  '+233 24 999 3333',
  'emmanuel@gentlemenscut.com',
  'Certified scalp therapist and precision cutter. Known for gentle hot-towel shaves.',
  true
)
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id;


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
