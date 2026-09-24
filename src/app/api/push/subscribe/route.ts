import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, role = "client", shopId, bookingId } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth || !shopId) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        role,
        shop_id: shopId,
        booking_id: bookingId || null,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
