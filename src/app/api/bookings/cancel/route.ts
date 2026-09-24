import { NextRequest, NextResponse } from "next/server";
import { cancelBookingByCode } from "@/lib/slot-engine/hold-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cancellationCode, reason } = body;

    if (!cancellationCode) {
      return NextResponse.json({ error: "cancellationCode is required" }, { status: 400 });
    }

    const result = await cancelBookingByCode(cancellationCode, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === "WINDOW_EXPIRED" ? 400 : 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
