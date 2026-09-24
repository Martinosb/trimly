import { SmsProvider } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

export class MockSmsProvider implements SmsProvider {
  name: "mock" = "mock";

  async send(params: { to: string; message: string; senderId?: string }): Promise<{ success: boolean; id: string }> {
    const id = `MOCK_SMS_${Date.now()}`;
    console.log(`[SMS MOCK] To: ${params.to} | From: ${params.senderId || "Trimly"} | Msg: "${params.message}"`);
    return { success: true, id };
  }
}

export class ArkeselSmsProvider implements SmsProvider {
  name: "arkesel" = "arkesel";
  private apiKey: string;
  private defaultSender: string;

  constructor(apiKey: string, defaultSender: string = "Trimly") {
    this.apiKey = apiKey;
    this.defaultSender = defaultSender;
  }

  async send(params: { to: string; message: string; senderId?: string }): Promise<{ success: boolean; id?: string }> {
    try {
      // Normalize Ghanaian mobile number (024XXXXXXX or +23324XXXXXXX -> 23324XXXXXXX)
      let formatted = params.to.replace(/\s+/g, "").replace(/^\+/, "");
      if (formatted.startsWith("0")) {
        formatted = "233" + formatted.slice(1);
      }

      const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: params.senderId || this.defaultSender,
          message: params.message,
          recipients: [formatted],
        }),
      });

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, id: data?.data?.id || `ARKESEL_${Date.now()}` };
    } catch (err) {
      console.error("[Arkesel SMS Provider Error]", err);
      return { success: false };
    }
  }
}

/**
 * Returns Arkesel provider if configured in environment, otherwise returns Mock provider.
 */
export function getSmsProvider(): SmsProvider {
  const isMock = process.env.MOCK_SMS_MODE === "true";
  const apiKey = process.env.ARKESEL_API_KEY;

  if (!isMock && apiKey && apiKey !== "mock_arkesel_api_key") {
    return new ArkeselSmsProvider(apiKey, process.env.ARKESEL_SENDER_ID || "Trimly");
  }

  return new MockSmsProvider();
}

/**
 * Sends SMS and logs the notification record in Supabase.
 */
export async function sendSmsNotification(params: {
  shopId: string;
  bookingId?: string | null;
  recipientType: "owner" | "staff" | "client";
  to: string;
  title: string;
  message: string;
  senderId?: string;
}) {
  const sms = getSmsProvider();
  const res = await sms.send({
    to: params.to,
    message: params.message,
    senderId: params.senderId || "Trimly",
  });

  const supabase = createAdminClient();
  await supabase.from("notifications").insert({
    shop_id: params.shopId,
    booking_id: params.bookingId || null,
    recipient_type: params.recipientType,
    recipient_contact: params.to,
    channel: "sms",
    title: params.title,
    body: params.message,
    status: res.success ? "sent" : "failed",
  });

  return res;
}

