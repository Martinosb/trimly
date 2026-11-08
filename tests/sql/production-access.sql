-- LOCAL TEST DATABASE ONLY. Contains fixtures and test grants; never run against production.
\set ON_ERROR_STOP on
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
INSERT INTO auth.users(id) VALUES ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
INSERT INTO public.shops(id,owner_id,name,slug,address,city,phone) VALUES ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Local security fixture','local-security','Local only','Accra','0241234567');
INSERT INTO public.staff(id,shop_id,name) VALUES ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Local only');
INSERT INTO public.services(id,shop_id,name,duration_min,price) VALUES ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Local service',30,50);
INSERT INTO public.staff_services(staff_id,service_id) VALUES ('30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001');
INSERT INTO public.staff_hours(staff_id,day_of_week,start_time,end_time,is_working) SELECT '30000000-0000-4000-8000-000000000001',d,'09:00','17:00',true FROM generate_series(0,6) d;
INSERT INTO public.bookings(shop_id,staff_id,service_id,client_name,client_phone,start_at,end_at,price,status,hold_expires_at) VALUES ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Private customer','0241234567',now()+interval '10 days',now()+interval '10 days 30 minutes',50,'pending',now()+interval '10 minutes');
SET ROLE anon;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.bookings) <> 0 THEN RAISE EXCEPTION 'Anonymous customer data leak'; END IF;
 IF has_function_privilege(current_user, 'public.confirm_booking(uuid,text,text,numeric)', 'EXECUTE') THEN RAISE EXCEPTION 'Anonymous confirmation RPC accessible'; END IF;
 IF has_function_privilege(current_user, 'public.create_booking_hold(uuid,uuid,uuid,text,text,text,text,timestamptz,text,integer)', 'EXECUTE') THEN RAISE EXCEPTION 'Anonymous hold RPC accessible'; END IF;
 UPDATE public.shops SET name='Attack' WHERE slug='local-security';
 IF FOUND THEN RAISE EXCEPTION 'Anonymous shop update allowed'; END IF;
 BEGIN
  INSERT INTO public.bookings(shop_id,staff_id,service_id,client_name,client_phone,start_at,end_at,price) VALUES ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Attack','0241234567',now()+interval '11 days',now()+interval '11 days 30 minutes',50);
  RAISE EXCEPTION 'Anonymous booking insert allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
SET ROLE authenticated;
DO $$ BEGIN
 UPDATE public.shops SET name='Owned shop' WHERE slug='local-security';
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner cannot update own shop'; END IF;
 BEGIN
  UPDATE public.shops SET is_suspended=true WHERE slug='local-security';
  RAISE EXCEPTION 'Owner suspension escalation allowed';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Shop ownership and suspension are managed by administrators' THEN RAISE; END IF;
 END;
 IF (SELECT count(*) FROM public.bookings) <> 1 THEN RAISE EXCEPTION 'Owner lost bookings'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
SET ROLE authenticated;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.bookings) <> 0 THEN RAISE EXCEPTION 'Cross-shop customer data leak'; END IF;
 BEGIN
  INSERT INTO public.shops(owner_id,name,slug,address,city,phone) VALUES ('10000000-0000-4000-8000-000000000001','Wrong owner','bad','Local','Accra','0241234567');
  RAISE EXCEPTION 'Forged ownership allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',false);
SET ROLE service_role;
DO $$ DECLARE bid uuid; b public.bookings; BEGIN
 SELECT booking_id INTO bid FROM public.create_booking_hold('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Local customer','0241234567',null,null,date_trunc('day',now())+interval '7 days 14 hours','pay_at_shop',10);
 SELECT * INTO b FROM public.confirm_booking(bid,'pay_at_shop','unpaid',0);
 IF b.status <> 'confirmed' OR b.payment_status <> 'unpaid' THEN RAISE EXCEPTION 'Confirmation did not preserve unpaid status'; END IF;
 BEGIN PERFORM public.confirm_booking(bid,'pay_at_shop','paid',50); RAISE EXCEPTION 'Fake payment accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Online payments require a verified provider integration' THEN RAISE; END IF; END;
 BEGIN PERFORM public.confirm_booking(bid,'pay_at_shop','unpaid',0); RAISE EXCEPTION 'Duplicate confirmation accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Reservation is unavailable or has expired' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SELECT 'All local access-control checks passed' AS result;
