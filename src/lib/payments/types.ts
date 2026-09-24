export type PaymentChannel = "momo_mtn" | "momo_voda" | "momo_airteltigo" | "card";

export interface InitializePaymentParams {
  bookingId: string;
  shopId: string;
  amount: number;
  currency: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone: string;
  channel?: PaymentChannel;
  paymentType: "deposit" | "full";
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  provider: "mock" | "paystack" | "hubtel";
  message?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  reference: string;
  amount: number;
  status: "successful" | "failed" | "pending";
  paidAt?: string;
  channel?: string;
}

export interface PaymentProvider {
  name: "mock" | "paystack" | "hubtel";
  initialize(params: InitializePaymentParams): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
}
