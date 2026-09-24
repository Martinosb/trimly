import { NextRequest, NextResponse } from "next/server";
import { createBookingHold } from "@/lib/slot-engine/hold-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
