import { NextRequest, NextResponse } from "next/server";
import { confirmBooking } from "@/lib/slot-engine/hold-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod, paymentStatus, paidAmount } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await confirmBooking(
      bookingId,
      paymentMethod || "pay_at_shop",
      paymentStatus || "unpaid",
      paidAmount ? Number(paidAmount) : undefined
    );

    return NextResponse.json({ success: true, booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
