import {
  PaymentProvider,
  InitializePaymentParams,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

export class PaystackPaymentProvider implements PaymentProvider {
  name: "paystack" = "paystack";
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const reference = `PAYSTACK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const email =
        params.clientEmail && params.clientEmail.includes("@")
          ? params.clientEmail
          : `${params.clientPhone.replace(/\D/g, "")}@trimly.cerkyl.com`;

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(params.amount * 100), // Paystack uses pesewas for GHS
          currency: params.currency || "GHS",
          reference,
          metadata: {
            bookingId: params.bookingId,
            shopId: params.shopId,
            clientPhone: params.clientPhone,
            paymentType: params.paymentType,
            ...params.metadata,
          },
          channels: ["mobile_money", "card"],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || "Failed to initialize Paystack transaction");
      }

      // Record pending payment
      const supabase = createAdminClient();
      await supabase.from("payments").insert({
        booking_id: params.bookingId,
        shop_id: params.shopId,
        amount: params.amount,
        currency: params.currency || "GHS",
        provider: "paystack",
        provider_reference: reference,
        payment_type: params.paymentType,
        status: "pending",
        metadata: data.data,
      });

      return {
        success: true,
        reference,
        authorizationUrl: data.data.authorization_url,
        provider: "paystack",
        message: "Paystack transaction initialized",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Paystack initialization error";
      console.error("[Paystack Error]", msg);
      return {
        success: false,
        reference,
        provider: "paystack",
        message: msg,
      };
    }
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        return {
          success: false,
          reference,
          amount: 0,
          status: "failed",
        };
      }

      const tx = data.data;
      const isSuccess = tx.status === "success";

      const supabase = createAdminClient();
      await supabase
        .from("payments")
        .update({
          status: isSuccess ? "successful" : "failed",
          metadata: tx,
        })
        .eq("provider_reference", reference);

      return {
        success: isSuccess,
        reference,
        amount: tx.amount / 100,
        status: isSuccess ? "successful" : "failed",
        paidAt: tx.paid_at,
        channel: tx.channel,
      };
    } catch (err: unknown) {
      return {
        success: false,
        reference,
        amount: 0,
        status: "failed",
      };
    }
  }
}
