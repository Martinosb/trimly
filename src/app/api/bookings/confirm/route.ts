import { NextRequest, NextResponse } from "next/server";
import { confirmBooking } from "@/lib/slot-engine/hold-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSmsNotification } from "@/lib/notifications/sms";
import { sendWebPushNotification } from "@/lib/notifications/web-push";

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

        const shopName = shop?.name || "Trimly Barber";
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
          message: `Trimly: Confirmed! ${serviceName} with ${staffName} at ${shopName} on ${dateFormatted} at ${timeFormatted}. Pass: ${manageUrl}`,
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
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

