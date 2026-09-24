import {
  PaymentProvider,
  InitializePaymentParams,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

export class MockPaymentProvider implements PaymentProvider {
  name: "mock" = "mock";

  async initialize(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const reference = `MOCK_TRX_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Record mock payment in DB
    const supabase = createAdminClient();
    await supabase.from("payments").insert({
      booking_id: params.bookingId,
      shop_id: params.shopId,
      amount: params.amount,
      currency: params.currency || "GHS",
      provider: "mock",
      provider_reference: reference,
      payment_type: params.paymentType,
      status: "successful",
      metadata: {
        channel: params.channel,
        phone: params.clientPhone,
        mode: "mock_simulation",
      },
    });

    return {
      success: true,
      reference,
      provider: "mock",
      message: "Mock MoMo payment completed successfully",
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const supabase = createAdminClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (!payment) {
      return {
        success: false,
        reference,
        amount: 0,
        status: "failed",
      };
    }

    return {
      success: payment.status === "successful",
      reference: payment.provider_reference || reference,
      amount: Number(payment.amount),
      status: payment.status as any,
      paidAt: payment.created_at,
    };
  }
}
