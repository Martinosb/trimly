import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushNotification } from "@/lib/notifications/web-push";
import { getSmsProvider } from "@/lib/notifications/sms";

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() + 50 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

  // Find confirmed bookings in the 1-hour window
  const { data: upcomingBookings, error } = await supabase
    .from("bookings")
    .select("*, shops(name, address, slug), staff(name)")
    .eq("status", "confirmed")
    .gte("start_at", windowStart)
    .lte("start_at", windowEnd);

  if (error || !upcomingBookings) {
    return NextResponse.json({ error: error?.message || "Failed to query bookings" }, { status: 500 });
  }

  const sms = getSmsProvider();
  let remindedCount = 0;

  for (const b of upcomingBookings) {
    const shopName = b.shops?.name || "your barber";
    const barberName = b.staff?.name || "your barber";
    const timeFormatted = new Date(b.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    // 1. Send Web Push to client & barber
    await sendWebPushNotification({
      shopId: b.shop_id,
      bookingId: b.id,
      role: "client",
      title: "Haircut in 1 Hour! ✂",
      body: `Reminder: Your cut at ${shopName} with ${barberName} starts at ${timeFormatted}.`,
      url: `/book/${b.shops?.slug || ""}/manage?code=${b.cancellation_code}`,
    });

    // 2. Send SMS reminder
    await sms.send({
      to: b.client_phone,
      message: `Trimly Reminder: Your appointment at ${shopName} starts in 1 hour (${timeFormatted}). See pass: /book/manage?code=${b.cancellation_code}`,
    });

    remindedCount++;
  }

  return NextResponse.json({
    success: true,
    reminded: remindedCount,
    checkedAt: now.toISOString(),
  });
}
