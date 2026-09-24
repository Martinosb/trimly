import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock-provider";

/**
 * Returns the configured payment provider.
 * Default is MockPaymentProvider.
 *
 * To plug in Paystack:
 * 1. Implement PaystackPaymentProvider conforming to PaymentProvider interface
 * 2. Set PAYSTACK_SECRET_KEY in .env.local
 * 3. Return PaystackPaymentProvider when process.env.PAYMENT_PROVIDER === 'paystack'
 *
 * To plug in Hubtel:
 * 1. Implement HubtelPaymentProvider conforming to PaymentProvider interface
 * 2. Set HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET in .env.local
 * 3. Return HubtelPaymentProvider when process.env.PAYMENT_PROVIDER === 'hubtel'
 */
export function getPaymentProvider(): PaymentProvider {
  return new MockPaymentProvider();
}

export * from "./types";
export * from "./mock-provider";
