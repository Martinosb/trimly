import { z } from "zod";

export const holdSchema = z.object({
  shopId: z.uuid(), serviceId: z.uuid(), staffId: z.union([z.uuid(), z.literal("any"), z.literal("all")]).nullish(),
  clientName: z.string().trim().min(2).max(100),
  clientPhone: z.string().trim().regex(/^(?:\+?233|0)[\s-]*[2-5](?:[\s-]*\d){8}$/, "Enter a valid Ghanaian phone number"),
  clientEmail: z.union([z.email().max(254), z.literal("")]).nullish(),
  clientNotes: z.string().max(500).nullish(),
  startAt: z.iso.datetime({ offset: true }).refine(value => {
    const days = (Date.parse(value) - Date.now()) / 86400000;
    return days > 0 && days <= 90;
  }, "Choose an available future appointment within 90 days"),
  paymentMethod: z.literal("pay_at_shop").default("pay_at_shop"),
});
export const confirmSchema = z.object({
  bookingId: z.uuid(), cancellationCode: z.string().min(6).max(128),
  paymentMethod: z.literal("pay_at_shop").default("pay_at_shop"),
  paymentStatus: z.literal("unpaid").optional(), paidAmount: z.literal(0).optional(),
});
