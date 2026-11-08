import { NextRequest, NextResponse } from "next/server";
import { holdSchema } from "@/lib/booking-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/slot-engine/availability";
import type { TimeSlot } from "@/lib/slot-engine/types";
import { createBookingHold } from "@/lib/slot-engine/hold-manager";

export async function POST(request: NextRequest) {
  try {
    const parsed = holdSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid booking details" }, { status: 400 });
    const body = parsed.data;
    const {
      shopId,
      serviceId,
      staffId,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      startAt,
      paymentMethod,
    } = body;

    if (!shopId || !serviceId || !clientName || !clientPhone || !startAt) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: shop } = await supabase.from("shops").select("slug, is_suspended, allow_pay_at_shop").eq("id", shopId).maybeSingle();
    if (!shop || shop.is_suspended) return NextResponse.json({ error: "This shop is not available for booking." }, { status: 404 });
    if (!shop.allow_pay_at_shop) return NextResponse.json({ error: "Online payment is not available yet. Please contact the shop to book." }, { status: 409 });
    const url = new URL(request.url);
    url.search = new URLSearchParams({ serviceId, date: startAt.slice(0, 10), staffId: staffId || "any" }).toString();
    const availability = await getAvailableSlots(new NextRequest(url), { params: Promise.resolve({ slug: shop.slug }) });
    const data = await availability.json();
    const available = (data.slots as TimeSlot[] | undefined)?.some(slot => slot.isAvailable && Date.parse(slot.startAt) === Date.parse(startAt));
    if (!available) return NextResponse.json({ error: "This appointment is no longer available. Choose another time." }, { status: 409 });

    const result = await createBookingHold({
      shopId,
      serviceId,
      staffId,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      startAt,
      paymentMethod,
      holdMinutes: 10,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === "SLOT_COLLISION" ? 409 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof SyntaxError ? "Invalid request" : "Unable to reserve this time. Please try again." }, { status: err instanceof SyntaxError ? 400 : 500 });
  }
}
