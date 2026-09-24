import { SmsProvider } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

export class MockSmsProvider implements SmsProvider {
  name: "mock" = "mock";

  async send(params: { to: string; message: string; senderId?: string }): Promise<{ success: boolean; id: string }> {
    const id = `MOCK_SMS_${Date.now()}`;
    // Log to console in dev mode
    console.log(`[SMS MOCK] To: ${params.to} | From: ${params.senderId || "Trimly"} | Msg: "${params.message}"`);
    return { success: true, id };
  }
}

/**
 * Arkesel SMS Plug-In Documentation:
 * To use real Ghanaian SMS via Arkesel:
 * 1. Obtain an API key from https://arkesel.com
 * 2. Set ARKESEL_API_KEY and ARKESEL_SENDER_ID in .env.local
 * 3. Make HTTP POST to https://sms.arkesel.com/api/v2/sms/send
 */
export function getSmsProvider(): SmsProvider {
  return new MockSmsProvider();
}
