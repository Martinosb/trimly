export type NotificationChannel = "push" | "sms" | "email";
export type RecipientType = "owner" | "staff" | "client";

export interface SendNotificationParams {
  shopId: string;
  bookingId?: string | null;
  recipientType: RecipientType;
  recipientContact: string; // phone, email, or push endpoint
  channel: NotificationChannel;
  title: string;
  body: string;
  url?: string;
}

export interface SmsProvider {
  name: "mock" | "arkesel";
  send(params: { to: string; message: string; senderId?: string }): Promise<{ success: boolean; id?: string }>;
}
