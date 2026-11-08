import { NextRequest, NextResponse } from "next/server";
import { confirmSchema } from "@/lib/booking-validation";
import { confirmBooking } from "@/lib/slot-engine/hold-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSmsNotification } from "@/lib/notifications/sms";
import { sendWebPushNotification } from "@/lib/notifications/web-push";

export async function POST(request: NextRequest) {
  try {
    const parsed = confirmSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A valid reservation reference is required. Payments must be verified by the server." }, { status: 400 });
    const { bookingId, cancellationCode } = parsed.data;
    const supabase = createAdminClient();
    const { data: hold } = await supabase.from("bookings").select("id, status, hold_expires_at, shops(is_suspended, allow_pay_at_shop)").eq("id", bookingId).eq("cancellation_code", cancellationCode).maybeSingle();
    if (!hold) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    if (hold.status !== "pending" || !hold.hold_expires_at || Date.parse(hold.hold_expires_at) <= Date.now()) return NextResponse.json({ error: "This reservation has expired or was already confirmed. Please check your booking pass." }, { status: 409 });
    const policy = hold.shops as unknown as { is_suspended: boolean; allow_pay_at_shop: boolean } | null;
    if (!policy || policy.is_suspended || !policy.allow_pay_at_shop) return NextResponse.json({ error: "This shop cannot accept this booking." }, { status: 409 });
    const booking = await confirmBooking(bookingId, "pay_at_shop", "unpaid", 0);

    // Asynchronously dispatch notifications (client SMS + owner/staff Web Push)
    try {
      const supabase = createAdminClient();
      const { data: bookingDetail } = await supabase
        .from("bookings")
        .select("*, shops(name, slug, phone, address), staff(name, phone), services(name, duration_min)")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingDetail) {
        const shop = bookingDetail.shops as unknown as { name: string; slug: string; phone: string; address: string } | null;
        const staff = bookingDetail.staff as unknown as { name: string; phone: string } | null;
        const service = bookingDetail.services as unknown as { name: string; duration_min: number } | null;

        const shopName = shop?.name || "GxStyl Barber";
        const shopSlug = shop?.slug || "";
        const staffName = staff?.name || "Your Barber";
        const serviceName = service?.name || "Haircut";
        const timeFormatted = new Date(bookingDetail.start_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        const dateFormatted = new Date(bookingDetail.start_at).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/book/${shopSlug}/manage?code=${bookingDetail.cancellation_code}`;

        // 1. Dispatch confirmation SMS to client
        await sendSmsNotification({
          shopId: bookingDetail.shop_id,
          bookingId: bookingDetail.id,
          recipientType: "client",
          to: bookingDetail.client_phone,
          title: "Booking Confirmed",
          message: `GxStyl: Confirmed! ${serviceName} with ${staffName} at ${shopName} on ${dateFormatted} at ${timeFormatted}. Pass: ${manageUrl}`,
        });

        // 2. Dispatch Web Push notification to Shop Owner
        await sendWebPushNotification({
          shopId: bookingDetail.shop_id,
          bookingId: bookingDetail.id,
          role: "owner",
          title: "New Booking! ✂",
          body: `${bookingDetail.client_name} booked ${serviceName} with ${staffName} on ${dateFormatted} at ${timeFormatted}.`,
          url: "/dashboard",
        });

        // 3. Dispatch Web Push notification to assigned Staff
        await sendWebPushNotification({
          shopId: bookingDetail.shop_id,
          bookingId: bookingDetail.id,
          role: "staff",
          title: "New Client Appointment ✂",
          body: `${bookingDetail.client_name} booked ${serviceName} with you on ${dateFormatted} at ${timeFormatted}.`,
          url: "/staff",
        });
      }
    } catch (notifyErr) {
      console.error("[Notification Dispatch Warning]", notifyErr);
      // Non-blocking: booking is already confirmed in DB
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: unknown) {
    console.error("Booking confirmation failed");
    return NextResponse.json({ error: "Unable to confirm this reservation. Please try again." }, { status: err instanceof SyntaxError ? 400 : 500 });
  }
}

