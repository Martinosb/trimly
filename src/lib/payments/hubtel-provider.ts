import {
  PaymentProvider,
  InitializePaymentParams,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

export class HubtelPaymentProvider implements PaymentProvider {
  name: "hubtel" = "hubtel";
  private clientId: string;
  private clientSecret: string;
  private merchantAccountNumber: string;

  constructor(clientId: string, clientSecret: string, merchantAccountNumber: string = "") {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.merchantAccountNumber = merchantAccountNumber;
  }

  private getBasicAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`;
  }

  async initialize(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const reference = `HUBTEL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      // Hubtel Online Checkout Invoice API
      const response = await fetch("https://api-topups.hubtel.com/v2/merchantaccount/onlinecheckout/invoice/create", {
        method: "POST",
        headers: {
          Authorization: this.getBasicAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice: {
            items: [
              {
                name: `Trimly Booking Reservation`,
                quantity: 1,
                unitPrice: params.amount,
                totalPrice: params.amount,
              },
            ],
            totalAmount: params.amount,
            description: `Payment for booking #${params.bookingId}`,
          },
          store: {
            name: "Trimly Ghana",
          },
          customData: {
            bookingId: params.bookingId,
            shopId: params.shopId,
            clientPhone: params.clientPhone,
          },
          actions: {
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Record in payments table
      const supabase = createAdminClient();
      await supabase.from("payments").insert({
        booking_id: params.bookingId,
        shop_id: params.shopId,
        amount: params.amount,
        currency: params.currency || "GHS",
        provider: "hubtel",
        provider_reference: reference,
        payment_type: params.paymentType,
        status: "pending",
        metadata: data,
      });

      return {
        success: true,
        reference,
        authorizationUrl: data?.response?.checkoutUrl || data?.data?.checkoutUrl,
        provider: "hubtel",
        message: "Hubtel invoice created",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hubtel initialization error";
      console.error("[Hubtel Error]", msg);
      return {
        success: false,
        reference,
        provider: "hubtel",
        message: msg,
      };
    }
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
