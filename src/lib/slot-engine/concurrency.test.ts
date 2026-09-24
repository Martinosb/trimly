import { describe, it, expect, afterAll } from "vitest";
import { createBookingHold } from "./hold-manager";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Database Concurrency & Double-Booking Exclusion Constraint", () => {
  const supabase = createAdminClient();

  const SHOP_ID = "11111111-1111-1111-1111-111111111111"; // Gentlemen's Cut
  const STAFF_ID = "22222222-2222-2222-2222-222222222221"; // Kojo Mensah
  const SERVICE_ID = "33333333-3333-3333-3333-333333333331"; // The Executive Cut (45 min)

  // Use a future date so it doesn't conflict with any existing bookings
  const testSlotStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  testSlotStart.setUTCHours(14, 0, 0, 0); // 14:00 UTC
  const slotISO = testSlotStart.toISOString();

  let createdBookingId: string | null = null;

  afterAll(async () => {
    if (createdBookingId) {
      await supabase.from("bookings").delete().eq("id", createdBookingId);
    }
    // Also clean up any test bookings on that slot
    await supabase
      .from("bookings")
      .delete()
      .eq("staff_id", STAFF_ID)
      .eq("start_at", slotISO);
  });

  it("proves two simultaneous booking attempts for the same barber & slot result in exactly one winner and one collision", async () => {
    // Fire both booking requests concurrently via Promise.all
    const [resultA, resultB] = await Promise.all([
      createBookingHold({
        shopId: SHOP_ID,
        staffId: STAFF_ID,
        serviceId: SERVICE_ID,
        clientName: "Client A (Simultaneous)",
        clientPhone: "+233 24 111 0001",
        clientEmail: "client.a@example.com",
        startAt: slotISO,
      }),
      createBookingHold({
        shopId: SHOP_ID,
        staffId: STAFF_ID,
        serviceId: SERVICE_ID,
        clientName: "Client B (Simultaneous)",
        clientPhone: "+233 24 111 0002",
        clientEmail: "client.b@example.com",
        startAt: slotISO,
      }),
    ]);

    // Track which one succeeded
    const successful = [resultA, resultB].filter((r) => r.success);
    const failed = [resultA, resultB].filter((r) => !r.success);

    // Exactly one must succeed
    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);

    const winner = successful[0];
    const loser = failed[0];

    expect(winner.booking).toBeDefined();
    createdBookingId = winner.booking!.id;

    // The loser must receive a SLOT_COLLISION error
    expect(loser.code).toBe("SLOT_COLLISION");
    expect(loser.error).toContain("This time slot was just booked");

    // Verify database state: exactly ONE booking exists for this slot
    const { data: dbRecords, error: dbError } = await supabase
      .from("bookings")
      .select("id, client_name, status")
      .eq("staff_id", STAFF_ID)
      .eq("start_at", slotISO);

    expect(dbError).toBeNull();
    expect(dbRecords).toBeDefined();
    expect(dbRecords!.length).toBe(1);
    expect(dbRecords![0].id).toBe(winner.booking!.id);
  });
});
