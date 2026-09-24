import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configure Web Push VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:moseiboakye@st.knust.edu.gh";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendWebPushNotification(params: {
  shopId: string;
  bookingId?: string | null;
  role: "owner" | "staff" | "client";
  title: string;
  body: string;
  url?: string;
}) {
  const supabase = createAdminClient();

  // Find relevant active subscriptions
  let query = supabase.from("push_subscriptions").select("*").eq("shop_id", params.shopId);

  if (params.bookingId && params.role === "client") {
    query = query.eq("booking_id", params.bookingId);
  } else {
    query = query.eq("role", params.role);
  }

  const { data: subs } = await query;

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    url: params.url || "/",
    icon: "/icon-192.png",
    badge: "/badge.png",
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
      sent++;

      // Log notification in DB
      await supabase.from("notifications").insert({
        shop_id: params.shopId,
        booking_id: params.bookingId || null,
        recipient_type: params.role,
        recipient_contact: sub.endpoint,
        channel: "push",
        title: params.title,
        body: params.body,
        status: "sent",
      });
    } catch (err: unknown) {
      failed++;
      // If endpoint is 410 Gone / expired, remove it
      const status = (err as any)?.statusCode;
      if (status === 410 || status === 404) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return { sent, failed };
}
