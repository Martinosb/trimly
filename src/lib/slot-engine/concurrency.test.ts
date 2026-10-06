import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createBookingHold } from "./hold-manager";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Database Concurrency & Double-Booking Exclusion Constraint", () => {
  let supabase: ReturnType<typeof createAdminClient>;
  const shopId = randomUUID();
  const staffId = randomUUID();
  const serviceId = randomUUID();
  let shopCreated = false;

  // A fresh shop/staff namespace avoids existing appointments and parallel runs.
  const slotStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  slotStart.setUTCHours(14, 0, 0, 0);
  const slotISO = slotStart.toISOString();

  beforeAll(async () => {
    // This test writes fixtures: never run it against the deployed database.
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321");
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error("The concurrency test requires a local Supabase database. Set NEXT_PUBLIC_SUPABASE_URL to your local stack; production databases are not supported.");
    }
    supabase = createAdminClient();
    const { error: connectionError } = await supabase.from("shops").select("id").limit(1);
    if (connectionError) {
      throw new Error(`Local Supabase is unavailable or its schema/credentials are not ready. Run supabase start, apply local migrations, and check .env.local. Database error: ${connectionError.message}`);
    }

    const { error: shopError } = await supabase.from("shops").insert({
      id: shopId, name: "Concurrency test shop", slug: `concurrency-test-${shopId}`,
      address: "Test fixture", city: "Test locality", phone: "+233 24 000 0000",
    });
    if (shopError) throw new Error(`Cannot create test shop: ${shopError.message}`);
    shopCreated = true;

    const { error: staffError } = await supabase.from("staff").insert({
      id: staffId, shop_id: shopId, name: "Concurrency test barber", is_active: true,
    });
    if (staffError) throw new Error(`Cannot create test barber: ${staffError.message}`);

    const { error: serviceError } = await supabase.from("services").insert({
      id: serviceId, shop_id: shopId, name: "Concurrency test haircut",
      duration_min: 45, price: 100, is_active: true,
    });
    if (serviceError) throw new Error(`Cannot create test service: ${serviceError.message}`);

    const { error: qualificationError } = await supabase.from("staff_services").insert({
      staff_id: staffId, service_id: serviceId,
    });
    if (qualificationError) throw new Error(`Cannot qualify test barber: ${qualificationError.message}`);
  });

  afterAll(async () => {
    if (!shopCreated) return;
    // Delete only this run's records, including partial setup or assertion failures.
    const { error: bookingsError } = await supabase.from("bookings").delete().eq("shop_id", shopId);
    if (bookingsError) throw new Error(`Cannot clean test bookings: ${bookingsError.message}`);
    const { error: shopError } = await supabase.from("shops").delete().eq("id", shopId);
    if (shopError) throw new Error(`Cannot clean test shop: ${shopError.message}`);
  });

  it("proves two simultaneous booking attempts for the same barber & slot result in exactly one winner and one collision", async () => {
    const attempts = await Promise.all(["A", "B"].map(client => createBookingHold({
      shopId, staffId, serviceId,
      clientName: `Client ${client} (Simultaneous)`,
      clientPhone: "+233 24 000 0000",
      startAt: slotISO,
    })));
    const successful = attempts.filter(result => result.success);
    const failed = attempts.filter(result => !result.success);

    // Expose actual RPC failures instead of an unhelpful "expected 0 to be 1".
    const errors = JSON.stringify(failed.map(result => ({ code: result.code, error: result.error })));
    expect(successful.length, `Expected one reservation; RPC errors: ${errors}`).toBe(1);
    expect(failed).toHaveLength(1);
    const winner = successful[0];
    const loser = failed[0];
    expect(winner.booking).toBeDefined();
    expect(loser.code).toBe("SLOT_COLLISION");
    expect(loser.error).toContain("This time slot was just booked");

    const { data: bookings, error } = await supabase.from("bookings")
      .select("id, client_name, status")
      .eq("shop_id", shopId).eq("staff_id", staffId).eq("start_at", slotISO);
    expect(error).toBeNull();
    expect(bookings).toHaveLength(1);
    expect(bookings![0].id).toBe(winner.booking!.id);
  });
});
