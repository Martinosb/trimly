import { createAdminClient } from "@/lib/supabase/admin";
import { BookingHoldParams, BookingHoldResult } from "./types";

/**
 * Creates an atomic booking hold using the Postgres RPC.
 * If another transaction books the exact same slot concurrently,
 * the Postgres EXCLUSION constraint triggers and this function returns
 * a friendly collision error.
 */
export async function createBookingHold(params: BookingHoldParams): Promise<BookingHoldResult> {
  const supabase = createAdminClient();

  const staffIdToPass =
    !params.staffId || params.staffId === "any" || params.staffId === "all"
      ? null
      : params.staffId;

  try {
    const { data, error } = await supabase.rpc("create_booking_hold", {
      p_shop_id: params.shopId,
      p_staff_id: staffIdToPass,
      p_service_id: params.serviceId,
      p_client_name: params.clientName,
      p_client_phone: params.clientPhone,
      p_client_email: params.clientEmail || null,
      p_client_notes: params.clientNotes || null,
      p_start_at: params.startAt,
      p_payment_method: params.paymentMethod || "pay_at_shop",
      p_hold_minutes: params.holdMinutes || 10,
    });

    if (error) {
      // Postgres Exclusion Constraint error code is 23P01
      if (error.code === "23P01" || error.message.includes("bookings_no_overlap") || error.message.includes("available")) {
        return {
          success: false,
          error: "This time slot was just booked by another client. Please choose an alternative slot.",
          code: "SLOT_COLLISION",
        };
      }

      return {
        success: false,
        error: error.message,
        code: error.code || "DB_ERROR",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Failed to reserve slot. Please try again.",
        code: "NO_DATA",
      };
    }

    const row = data[0];
    return {
      success: true,
      booking: {
        id: row.booking_id,
        shopId: params.shopId,
        staffId: row.staff_id,
        staffName: row.staff_name,
        serviceId: row.service_id,
        serviceName: row.service_name,
        startAt: row.start_at,
        endAt: row.end_at,
        price: Number(row.price),
        depositAmount: Number(row.deposit_amount),
        status: row.status,
        holdExpiresAt: row.hold_expires_at,
        cancellationCode: row.cancellation_code,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error creating booking hold";
    return {
      success: false,
      error: message,
      code: "UNKNOWN",
    };
  }
}

/**
 * Confirms a held booking after payment or selection of pay-at-shop
 */
export async function confirmBooking(
  bookingId: string,
  paymentMethod: string,
  paymentStatus: "paid" | "deposit_paid" | "unpaid",
  paidAmount?: number
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("confirm_booking", {
    p_booking_id: bookingId,
    p_payment_method: paymentMethod,
    p_payment_status: paymentStatus,
    p_paid_amount: paidAmount ?? 0,
  });

  if (error) {
    throw new Error(`Failed to confirm booking: ${error.message}`);
  }

  return data;
}

/**
 * Cancels a booking using its unique cancellation code
 */
export async function cancelBookingByCode(cancellationCode: string, reason?: string) {
  const supabase = createAdminClient();

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("id, shop_id, start_at, status, shops(cancellation_hours)")
    .eq("cancellation_code", cancellationCode)
    .single();

  if (findError || !booking) {
    return { success: false, error: "Booking not found with this code" };
  }

  if (booking.status === "cancelled") {
    return { success: false, error: "This booking is already cancelled" };
  }

  // Check cancellation policy window
  const shopData = booking.shops as unknown as { cancellation_hours: number } | null;
  const minHours = shopData?.cancellation_hours ?? 2;
  const bookingStart = new Date(booking.start_at).getTime();
  const now = Date.now();
  const hoursUntilBooking = (bookingStart - now) / (1000 * 60 * 60);

  if (hoursUntilBooking < minHours) {
    return {
      success: false,
      error: `Cancellations must be made at least ${minHours} hour(s) before the appointment.`,
      code: "WINDOW_EXPIRED",
    };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      client_notes: reason ? `Cancelled by client: ${reason}` : "Cancelled by client",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, bookingId: booking.id };
}
