import { describe, it, expect } from "vitest";
import { holdSchema, confirmSchema } from "./booking-validation";
const bookingId = "9834c38e-3e78-478d-b32d-dd12f979bc69";
describe("public booking boundaries", () => {
  it("rejects client-reported successful payments", () => {
    expect(confirmSchema.safeParse({ bookingId, cancellationCode: "ABC12345", paymentStatus: "paid", paidAmount: 50 }).success).toBe(false);
    expect(confirmSchema.safeParse({ bookingId, cancellationCode: "ABC12345", paymentMethod: "momo_mtn" }).success).toBe(false);
  });
  it("requires the reservation capability to confirm", () => {
    expect(confirmSchema.safeParse({ bookingId }).success).toBe(false);
    expect(confirmSchema.safeParse({ bookingId, cancellationCode: "ABC12345", paymentMethod: "pay_at_shop" }).success).toBe(true);
  });
  it("validates phone numbers, appointment windows, and field sizes", () => {
    const valid = { shopId: bookingId, serviceId: bookingId, clientName: "Booking test", clientPhone: "+233 24 123 4567", startAt: new Date(Date.now() + 86400000).toISOString() };
    expect(holdSchema.safeParse(valid).success).toBe(true);
    for (const patch of [{clientPhone:"123"},{startAt:new Date(Date.now()-86400000).toISOString()},{clientNotes:"x".repeat(501)},{paymentMethod:"momo_mtn"}]) expect(holdSchema.safeParse({...valid,...patch}).success).toBe(false);
  });
});
