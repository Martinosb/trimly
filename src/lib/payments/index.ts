import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock-provider";
import { PaystackPaymentProvider } from "./paystack-provider";
import { HubtelPaymentProvider } from "./hubtel-provider";

/**
 * Returns the configured payment provider.
 * Priority:
 * 1. If PAYMENT_PROVIDER === 'paystack' and PAYSTACK_SECRET_KEY is present -> PaystackPaymentProvider
 * 2. If PAYMENT_PROVIDER === 'hubtel' and HUBTEL_CLIENT_ID is present -> HubtelPaymentProvider
 * 3. Default -> MockPaymentProvider
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();

  if (
    provider === "paystack" &&
    process.env.PAYSTACK_SECRET_KEY &&
    process.env.PAYSTACK_SECRET_KEY !== "mock_paystack_secret_key"
  ) {
    return new PaystackPaymentProvider(process.env.PAYSTACK_SECRET_KEY);
  }

  if (
    provider === "hubtel" &&
    process.env.HUBTEL_CLIENT_ID &&
    process.env.HUBTEL_CLIENT_ID !== "mock_hubtel_client_id"
  ) {
    return new HubtelPaymentProvider(
      process.env.HUBTEL_CLIENT_ID,
      process.env.HUBTEL_CLIENT_SECRET || "",
      process.env.HUBTEL_MERCHANT_ACCOUNT || ""
    );
  }

  return new MockPaymentProvider();
}

export * from "./types";
export * from "./mock-provider";
export * from "./paystack-provider";
export * from "./hubtel-provider";

