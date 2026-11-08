-- Production access controls. Apply to the EXISTING GxStyl project.
-- The app must be deployed with capability-checked booking endpoints first.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid());
$$;
ALTER FUNCTION public.is_shop_owner(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_shop_staff(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.release_expired_holds() SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "Platform admins see all shops" ON public.shops;
DROP POLICY IF EXISTS "Public read active shops" ON public.shops;
CREATE POLICY "Public read active shops" ON public.shops FOR SELECT
  USING (NOT is_suspended OR public.is_shop_owner(id) OR public.is_shop_staff(id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "Authenticated users can create shop" ON public.shops;
CREATE POLICY "Authenticated users can create shop" ON public.shops FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND NOT is_suspended);

-- A booking reference is a capability checked by the server, never a table-wide read grant.
DROP POLICY IF EXISTS "Public can view own booking with code" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert bookings via RPC or direct hold" ON public.bookings;
CREATE POLICY "Owners create walk-ins" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK ((public.is_shop_owner(shop_id) OR public.is_platform_admin())
    AND EXISTS (SELECT 1 FROM public.staff s WHERE s.id = bookings.staff_id AND s.shop_id = bookings.shop_id)
    AND EXISTS (SELECT 1 FROM public.services sv WHERE sv.id = bookings.service_id AND sv.shop_id = bookings.shop_id));
DROP POLICY IF EXISTS "Service role and RPC insert payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can register push subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users read their subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users read their subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_shop_owner(shop_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public read time off for slot calculation" ON public.time_off;
CREATE POLICY "Team reads time off" ON public.time_off FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND (public.is_shop_owner(s.shop_id) OR s.user_id = (SELECT auth.uid()) OR public.is_platform_admin())));

-- Prevent an owner from assigning their shop to someone else or undoing an admin suspension.
CREATE OR REPLACE FUNCTION public.protect_shop_administration()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') AND NOT public.is_platform_admin() THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
      RAISE EXCEPTION 'Shop ownership and suspension are managed by administrators';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_shop_administration ON public.shops;
CREATE TRIGGER protect_shop_administration BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.protect_shop_administration();

CREATE OR REPLACE FUNCTION public.create_booking_hold(
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
SET search_path = public, pg_temp
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
  IF p_start_at <= now() OR p_start_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'Choose a future appointment within 90 days';
  END IF;
  IF p_hold_minutes < 1 OR p_hold_minutes > 10 OR p_payment_method <> 'pay_at_shop' THEN
    RAISE EXCEPTION 'Invalid reservation parameters';
  END IF;
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

  -- Apply the same availability rules to a specific barber and automatic assignment.
  IF NOT EXISTS (
    SELECT 1 FROM staff_hours h WHERE h.staff_id = v_assigned_staff_id
      AND h.day_of_week = extract(dow FROM p_start_at AT TIME ZONE 'Africa/Accra')::int
      AND h.is_working AND h.start_time <= (p_start_at AT TIME ZONE 'Africa/Accra')::time
      AND h.end_time >= (v_end_at AT TIME ZONE 'Africa/Accra')::time
  ) OR EXISTS (
    SELECT 1 FROM time_off t WHERE t.staff_id = v_assigned_staff_id
      AND t.start_at < v_end_at AND t.end_at > p_start_at
  ) THEN RAISE EXCEPTION 'Selected barber is unavailable for this time'; END IF;

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

CREATE OR REPLACE FUNCTION public.confirm_booking(
  p_booking_id uuid, p_payment_method text, p_payment_status text DEFAULT 'unpaid', p_paid_amount numeric DEFAULT NULL
) RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_booking public.bookings%ROWTYPE;
BEGIN
  IF p_payment_method <> 'pay_at_shop' OR p_payment_status <> 'unpaid' OR coalesce(p_paid_amount, 0) <> 0 THEN
    RAISE EXCEPTION 'Online payments require a verified provider integration';
  END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status <> 'pending' OR v_booking.hold_expires_at IS NULL OR v_booking.hold_expires_at <= now() THEN
    RAISE EXCEPTION 'Reservation is unavailable or has expired';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = v_booking.shop_id AND NOT is_suspended AND allow_pay_at_shop) THEN
    RAISE EXCEPTION 'Shop cannot accept this booking';
  END IF;
  UPDATE public.bookings SET status = 'confirmed', payment_method = 'pay_at_shop', payment_status = 'unpaid',
    hold_expires_at = NULL, updated_at = now() WHERE id = p_booking_id RETURNING * INTO v_booking;
  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_hold(uuid, uuid, uuid, text, text, text, text, timestamptz, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_booking(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_expired_holds() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_hold(uuid, uuid, uuid, text, text, text, text, timestamptz, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_booking(uuid, text, text, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_holds() TO service_role;
COMMIT;
