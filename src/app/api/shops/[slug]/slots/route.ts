import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableSlots } from "@/lib/slot-engine/slot-generator";
import { StaffScheduleRecord } from "@/lib/slot-engine/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);

  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Fetch shop
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, is_suspended, cancellation_hours")
    .eq("slug", slug)
    .single();

  if (shopError || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  if (shop.is_suspended) {
    return NextResponse.json({ error: "Shop is currently unavailable", isSuspended: true }, { status: 403 });
  }

  // 2. Fetch service duration
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_min, price")
    .eq("id", serviceId)
    .eq("shop_id", shop.id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  // 3. Fetch qualified staff who offer this service
  let staffQuery = supabase
    .from("staff")
    .select("id, name, is_active, staff_services!inner(service_id)")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .eq("staff_services.service_id", serviceId);

  if (staffId && staffId !== "any" && staffId !== "all") {
    staffQuery = staffQuery.eq("id", staffId);
  }

  const { data: qualifiedStaff, error: staffError } = await staffQuery;

  if (staffError || !qualifiedStaff || qualifiedStaff.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  const qualifiedStaffIds = qualifiedStaff.map((s) => s.id);

  // 4. Fetch staff working hours for this day of week
  const [year, month, day] = date.split("-").map(Number);
  const targetDateObj = new Date(year, month - 1, day);
  const dayOfWeek = targetDateObj.getDay();

  const { data: workingHours } = await supabase
    .from("staff_hours")
    .select("staff_id, start_time, end_time, is_working")
    .in("staff_id", qualifiedStaffIds)
    .eq("day_of_week", dayOfWeek);

  // 5. Fetch existing active bookings on that date
  const dayStart = new Date(year, month - 1, day, 0, 0, 0).toISOString();
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59).toISOString();

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("staff_id, start_at, end_at, status, hold_expires_at")
    .in("staff_id", qualifiedStaffIds)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", dayStart)
    .lte("start_at", dayEnd);

  // 6. Fetch time-off on that date
  const { data: timeOffRecords } = await supabase
    .from("time_off")
    .select("staff_id, start_at, end_at")
    .in("staff_id", qualifiedStaffIds)
    .lte("start_at", dayEnd)
    .gte("end_at", dayStart);

  // 7. Assemble staff schedule records
  const staffSchedules: StaffScheduleRecord[] = qualifiedStaff.map((st) => {
    const hours = workingHours?.find((h) => h.staff_id === st.id);
    const bookings = existingBookings?.filter((b) => b.staff_id === st.id) || [];
    const timeOff = timeOffRecords?.filter((t) => t.staff_id === st.id) || [];

    return {
      staffId: st.id,
      staffName: st.name,
      isWorkingToday: hours ? hours.is_working : false,
      workStart: hours ? hours.start_time.slice(0, 5) : "09:00",
      workEnd: hours ? hours.end_time.slice(0, 5) : "18:00",
      timeOff: timeOff.map((t) => ({ startAt: t.start_at, endAt: t.end_at })),
      existingBookings: bookings.map((b) => ({
        startAt: b.start_at,
        endAt: b.end_at,
        status: b.status,
        holdExpiresAt: b.hold_expires_at,
      })),
    };
  });

  // 8. Run pure calculation
  const slots = calculateAvailableSlots({
    date,
    serviceDurationMin: service.duration_min,
    intervalMin: 15,
    bufferMin: 0,
    specificStaffId: staffId && staffId !== "any" ? staffId : null,
    staffSchedules,
    now: new Date(),
  });

  return NextResponse.json({
    slots,
    service,
    shopId: shop.id,
  });
}
