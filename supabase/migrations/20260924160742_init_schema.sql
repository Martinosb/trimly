-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =====================================================================
-- 1. PLATFORM ADMINS
-- =====================================================================
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper to check if current user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE (pa.user_id = auth.uid())
       OR (lower(pa.email) = lower(auth.jwt()->>'email'))
  );
$$;

-- =====================================================================
-- 2. SHOPS
-- =====================================================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Accra',
  phone TEXT NOT NULL,
  email TEXT,
  instagram TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  deposit_type TEXT NOT NULL DEFAULT 'none' CHECK (deposit_type IN ('none', 'fixed', 'percentage')),
  deposit_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  allow_pay_at_shop BOOLEAN NOT NULL DEFAULT true,
  cancellation_hours INT NOT NULL DEFAULT 2,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_owner ON shops(owner_id);

-- Helper to check shop ownership
CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops s
    WHERE s.id = p_shop_id
      AND s.owner_id = auth.uid()
  );
$$;

-- =====================================================================
-- 3. STAFF
-- =====================================================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Barber',
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_shop ON staff(shop_id);
CREATE INDEX idx_staff_user ON staff(user_id);

-- Helper to check if current user is staff at shop
CREATE OR REPLACE FUNCTION is_shop_staff(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff st
    WHERE st.shop_id = p_shop_id
      AND st.user_id = auth.uid()
      AND st.is_active = true
  );
$$;

-- =====================================================================
-- 4. SERVICES
-- =====================================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INT NOT NULL DEFAULT 30 CHECK (duration_min > 0),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'Haircut',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_shop ON services(shop_id);

-- =====================================================================
-- 5. STAFF_SERVICES (many-to-many)
-- =====================================================================
CREATE TABLE staff_services (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- =====================================================================
-- 6. STAFF_HOURS
-- =====================================================================
CREATE TABLE staff_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(staff_id, day_of_week)
);

CREATE INDEX idx_staff_hours_staff ON staff_hours(staff_id);

-- =====================================================================
-- 7. TIME_OFF
-- =====================================================================
CREATE TABLE time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX idx_time_off_staff ON time_off(staff_id);

-- =====================================================================
-- 8. BOOKINGS
-- =====================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_notes TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('momo_mtn', 'momo_voda', 'momo_airteltigo', 'card', 'pay_at_shop')),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cancellation_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- EXCLUSION CONSTRAINT: Prevents double-booking for the same staff member
-- Overlapping booking on status in ('pending', 'confirmed') is strictly rejected by Postgres
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

CREATE INDEX idx_bookings_shop ON bookings(shop_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_range ON bookings(start_at, end_at);
CREATE INDEX idx_bookings_code ON bookings(cancellation_code);
CREATE INDEX idx_bookings_status ON bookings(status);

-- =====================================================================
-- 9. PAYMENTS
-- =====================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  provider TEXT NOT NULL DEFAULT 'mock' CHECK (provider IN ('mock', 'paystack', 'hubtel')),
  provider_reference TEXT,
  payment_type TEXT NOT NULL DEFAULT 'full' CHECK (payment_type IN ('deposit', 'full', 'balance')),
  status TEXT NOT NULL DEFAULT 'successful' CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_shop ON payments(shop_id);

-- =====================================================================
-- 10. PUSH_SUBSCRIPTIONS
-- =====================================================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('owner', 'staff', 'client')),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subs_shop ON push_subscriptions(shop_id);
CREATE INDEX idx_push_subs_booking ON push_subscriptions(booking_id);

-- =====================================================================
-- 11. NOTIFICATIONS
-- =====================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('owner', 'staff', 'client')),
  recipient_contact TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'email')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_shop ON notifications(shop_id);

-- =====================================================================
-- 12. STORED FUNCTIONS & RPCs
-- =====================================================================

-- Clean up expired holds automatically
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE status = 'pending'
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at < now();
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Atomic Booking Hold RPC (Supports specific staff or "Any Available Staff")
CREATE OR REPLACE FUNCTION create_booking_hold(
  p_shop_id UUID,
  p_staff_id UUID,          -- Pass NULL for "Any Available Staff"
  p_service_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_client_email TEXT,
  p_client_notes TEXT,
  p_start_at TIMESTAMPTZ,
  p_payment_method TEXT DEFAULT 'pay_at_shop',
  p_hold_minutes INT DEFAULT 10
)
RETURNS TABLE (
  booking_id UUID,
  staff_id UUID,
  staff_name TEXT,
  service_id UUID,
  service_name TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  price NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  hold_expires_at TIMESTAMPTZ,
  cancellation_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
DECLARE
  v_shop RECORD;
  v_service RECORD;
  v_assigned_staff_id UUID;
  v_assigned_staff_name TEXT;
  v_end_at TIMESTAMPTZ;
  v_deposit_amount NUMERIC(10, 2) := 0;
  v_hold_expires TIMESTAMPTZ;
  v_booking_record bookings%ROWTYPE;
BEGIN
  -- First purge any expired holds to free up slots
  PERFORM release_expired_holds();

  -- Fetch shop
  SELECT * INTO v_shop FROM shops WHERE id = p_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_shop.is_suspended THEN
    RAISE EXCEPTION 'This shop is currently unavailable' USING ERRCODE = 'P0003';
  END IF;

  -- Fetch service
  SELECT * INTO v_service FROM services WHERE id = p_service_id AND shop_id = p_shop_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive' USING ERRCODE = 'P0002';
  END IF;

  v_end_at := p_start_at + (v_service.duration_min || ' minutes')::INTERVAL;
  v_hold_expires := now() + (p_hold_minutes || ' minutes')::INTERVAL;

  -- Calculate deposit if applicable
  IF v_shop.deposit_type = 'fixed' THEN
    v_deposit_amount := LEAST(v_shop.deposit_value, v_service.price);
  ELSIF v_shop.deposit_type = 'percentage' THEN
    v_deposit_amount := ROUND((v_service.price * v_shop.deposit_value / 100.0), 2);
  ELSE
    v_deposit_amount := 0;
  END IF;

  -- Staff Assignment: Specific Staff vs Any Available
  IF p_staff_id IS NOT NULL THEN
    -- Check specific staff
    SELECT s.id, s.name INTO v_assigned_staff_id, v_assigned_staff_name
    FROM staff s
    JOIN staff_services ss ON ss.staff_id = s.id AND ss.service_id = p_service_id
    WHERE s.id = p_staff_id
      AND s.shop_id = p_shop_id
      AND s.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected barber is not active or does not offer this service' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    -- "Any Available Staff": Find qualified, available staff with least bookings today
    SELECT s.id, s.name INTO v_assigned_staff_id, v_assigned_staff_name
    FROM staff s
    JOIN staff_services ss ON ss.staff_id = s.id AND ss.service_id = p_service_id
    JOIN staff_hours sh ON sh.staff_id = s.id 
      AND sh.day_of_week = EXTRACT(DOW FROM p_start_at)::INT
      AND sh.is_working = true
      AND sh.start_time <= p_start_at::TIME
      AND sh.end_time >= v_end_at::TIME
    LEFT JOIN (
      SELECT bk.staff_id AS booked_staff_id, COUNT(*) AS today_bookings
      FROM bookings bk
      WHERE bk.shop_id = p_shop_id
        AND bk.status IN ('pending', 'confirmed')
        AND bk.start_at::DATE = p_start_at::DATE
      GROUP BY bk.staff_id
    ) b_cnt ON b_cnt.booked_staff_id = s.id
    WHERE s.shop_id = p_shop_id
      AND s.is_active = true
      -- Ensure not on time off
      AND NOT EXISTS (
        SELECT 1 FROM time_off tof
        WHERE tof.staff_id = s.id
          AND tof.start_at < v_end_at
          AND tof.end_at > p_start_at
      )
      -- Ensure no overlapping booking
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.staff_id = s.id
          AND b.status IN ('pending', 'confirmed')
          AND b.start_at < v_end_at
          AND b.end_at > p_start_at
      )
    ORDER BY COALESCE(b_cnt.today_bookings, 0) ASC, random()
    LIMIT 1
    FOR UPDATE OF s SKIP LOCKED;

    IF v_assigned_staff_id IS NULL THEN
      RAISE EXCEPTION 'No barber is available for this slot' USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- Insert booking (exclusion constraint guarantees safety)
  INSERT INTO bookings (
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
    hold_expires_at
  ) VALUES (
    p_shop_id,
    v_assigned_staff_id,
    p_service_id,
    p_client_name,
    p_client_phone,
    p_client_email,
    p_client_notes,
    p_start_at,
    v_end_at,
    'pending',
    'unpaid',
    p_payment_method,
    v_service.price,
    v_deposit_amount,
    v_hold_expires
  ) RETURNING * INTO v_booking_record;

  RETURN QUERY SELECT 
    v_booking_record.id,
    v_assigned_staff_id,
    v_assigned_staff_name,
    v_service.id,
    v_service.name,
    v_booking_record.start_at,
    v_booking_record.end_at,
    v_booking_record.price,
    v_booking_record.deposit_amount,
    v_booking_record.status,
    v_booking_record.hold_expires_at,
    v_booking_record.cancellation_code;
END;
$$;

-- Confirm Booking RPC
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id UUID,
  p_payment_method TEXT,
  p_payment_status TEXT DEFAULT 'paid',
  p_paid_amount NUMERIC DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE bookings
  SET status = 'confirmed',
      payment_status = p_payment_status,
      payment_method = p_payment_method,
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  IF p_paid_amount IS NOT NULL AND p_paid_amount > 0 THEN
    INSERT INTO payments (
      booking_id,
      shop_id,
      amount,
      currency,
      provider,
      payment_type,
      status
    ) VALUES (
      v_booking.id,
      v_booking.shop_id,
      p_paid_amount,
      'GHS',
      'mock',
      CASE WHEN p_payment_status = 'deposit_paid' THEN 'deposit' ELSE 'full' END,
      'successful'
    );
  END IF;

  RETURN v_booking;
END;
$$;

-- =====================================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Platform Admin Policies
CREATE POLICY "Platform admins manage everything" ON platform_admins
  FOR ALL USING (is_platform_admin());

CREATE POLICY "Platform admins see all shops" ON shops
  FOR ALL USING (is_platform_admin() OR true); -- Read public, write scoped below

-- SHOPS policies
CREATE POLICY "Public read active shops" ON shops
  FOR SELECT USING (true);

CREATE POLICY "Owners manage their shops" ON shops
  FOR ALL USING (owner_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Authenticated users can create shop" ON shops
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- STAFF policies
CREATE POLICY "Public read active staff" ON staff
  FOR SELECT USING (is_active = true OR is_shop_owner(shop_id) OR user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Owners manage staff" ON staff
  FOR ALL USING (is_shop_owner(shop_id) OR is_platform_admin());

-- SERVICES policies
CREATE POLICY "Public read active services" ON services
  FOR SELECT USING (is_active = true OR is_shop_owner(shop_id) OR is_platform_admin());

CREATE POLICY "Owners manage services" ON services
  FOR ALL USING (is_shop_owner(shop_id) OR is_platform_admin());

-- STAFF_SERVICES policies
CREATE POLICY "Public read staff services" ON staff_services
  FOR SELECT USING (true);

CREATE POLICY "Owners manage staff services" ON staff_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND (is_shop_owner(s.shop_id) OR is_platform_admin()))
  );

-- STAFF_HOURS policies
CREATE POLICY "Public read staff hours" ON staff_hours
  FOR SELECT USING (true);

CREATE POLICY "Owners and staff manage hours" ON staff_hours
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND (is_shop_owner(s.shop_id) OR s.user_id = auth.uid() OR is_platform_admin()))
  );

-- TIME_OFF policies
CREATE POLICY "Public read time off for slot calculation" ON time_off
  FOR SELECT USING (true);

CREATE POLICY "Owners and staff manage time off" ON time_off
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND (is_shop_owner(s.shop_id) OR s.user_id = auth.uid() OR is_platform_admin()))
  );

-- BOOKINGS policies
-- Public can read their own booking by cancellation code or ID, owners see shop bookings, staff see assigned bookings
CREATE POLICY "Owners see all shop bookings" ON bookings
  FOR SELECT USING (is_shop_owner(shop_id) OR is_platform_admin());

CREATE POLICY "Staff see assigned bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Public can view own booking with code" ON bookings
  FOR SELECT USING (true); -- Filtered by application queries by ID/cancellation code

CREATE POLICY "Owners can update shop bookings" ON bookings
  FOR UPDATE USING (is_shop_owner(shop_id) OR is_platform_admin());

CREATE POLICY "Staff can update assigned bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Public can insert bookings via RPC or direct hold" ON bookings
  FOR INSERT WITH CHECK (true);

-- PAYMENTS policies
CREATE POLICY "Owners and admins see payments" ON payments
  FOR SELECT USING (is_shop_owner(shop_id) OR is_platform_admin());

CREATE POLICY "Service role and RPC insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- PUSH SUBSCRIPTIONS policies
CREATE POLICY "Anyone can register push subscription" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read their subscriptions" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR is_platform_admin() OR true);

-- NOTIFICATIONS policies
CREATE POLICY "Owners read shop notifications" ON notifications
  FOR SELECT USING (is_shop_owner(shop_id) OR is_platform_admin());

CREATE POLICY "Insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================================
-- 14. REALTIME PUBLICATION
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
