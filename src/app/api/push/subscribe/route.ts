import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return NextResponse.json({ error: "Push notifications are not available yet." }, { status: 503 });
  const parsed = z.object({
    endpoint: z.url().max(2048), keys: z.object({ p256dh: z.string().min(20).max(256), auth: z.string().min(10).max(128) }),
    role: z.enum(["client", "owner", "staff"]).default("client"), shopId: z.uuid(), bookingId: z.uuid().optional(), cancellationCode: z.string().min(6).max(128).optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  const { endpoint, keys, role, shopId, bookingId, cancellationCode } = parsed.data;
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || !["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(url.hostname)) return NextResponse.json({ error: "Unsupported push service." }, { status: 400 });
  const supabase = createAdminClient();
  const user = await getCurrentUser();
  if (role === "client") {
    if (!bookingId || !cancellationCode) return NextResponse.json({ error: "Booking reference required." }, { status: 403 });
    const { data } = await supabase.from("bookings").select("id").eq("id", bookingId).eq("shop_id", shopId).eq("cancellation_code", cancellationCode).maybeSingle();
    if (!data) return NextResponse.json({ error: "Booking not found." }, { status: 403 });
  } else {
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { data: shop } = await supabase.from("shops").select("owner_id").eq("id", shopId).maybeSingle();
    const { data: staff } = await supabase.from("staff").select("id").eq("shop_id", shopId).eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (role === "owner" ? shop?.owner_id !== user.id : !staff) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  const { error } = await supabase.from("push_subscriptions").upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth, role, shop_id: shopId, booking_id: bookingId || null, user_id: user?.id || null }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Unable to enable notifications." }, { status: 500 });
  return NextResponse.json({ success: true });
}
