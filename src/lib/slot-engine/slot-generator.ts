import { TimeSlot, SlotGenerationParams, BarberInfo } from "./types";

/**
 * Formats a Date object or ISO string to a clean 12-hour display string (e.g. "9:30 AM", "2:00 PM")
 */
export function formatSlotTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Pure function to calculate available booking slots for a given date, service, and staff configuration.
 */
export function calculateAvailableSlots(params: SlotGenerationParams): TimeSlot[] {
  const {
    date,
    serviceDurationMin,
    intervalMin = 15,
    bufferMin = 0,
    specificStaffId,
    staffSchedules,
    now = new Date(),
  } = params;

  if (!staffSchedules || staffSchedules.length === 0) {
    return [];
  }

  // Filter staff if specific barber requested
  const relevantStaff = specificStaffId
    ? staffSchedules.filter((s) => s.staffId === specificStaffId)
    : staffSchedules;

  if (relevantStaff.length === 0) {
    return [];
  }

  // Find the earliest work start and latest work end across working staff
  let earliestStartMinutes = 24 * 60;
  let latestEndMinutes = 0;

  for (const staff of relevantStaff) {
    if (!staff.isWorkingToday || !staff.workStart || !staff.workEnd) continue;

    const [startH, startM] = staff.workStart.split(":").map(Number);
    const [endH, endM] = staff.workEnd.split(":").map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal < earliestStartMinutes) earliestStartMinutes = startTotal;
    if (endTotal > latestEndMinutes) latestEndMinutes = endTotal;
  }

  // If no staff is working on this day
  if (earliestStartMinutes >= latestEndMinutes) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const [year, month, day] = date.split("-").map(Number);

  // Generate slots in increments of intervalMin
  for (
    let currentMinute = earliestStartMinutes;
    currentMinute + serviceDurationMin <= latestEndMinutes;
    currentMinute += intervalMin
  ) {
    const slotStartHours = Math.floor(currentMinute / 60);
    const slotStartMins = currentMinute % 60;

    const slotStartDate = new Date(year, month - 1, day, slotStartHours, slotStartMins, 0, 0);
    const slotEndDate = new Date(
      slotStartDate.getTime() + serviceDurationMin * 60 * 1000
    );

    // Skip slots in the past
    if (slotStartDate.getTime() <= now.getTime()) {
      continue;
    }

    const availableBarbers: BarberInfo[] = [];

    for (const staff of relevantStaff) {
      if (!staff.isWorkingToday || !staff.workStart || !staff.workEnd) continue;

      const [sStartH, sStartM] = staff.workStart.split(":").map(Number);
      const [sEndH, sEndM] = staff.workEnd.split(":").map(Number);

      const staffStart = new Date(year, month - 1, day, sStartH, sStartM, 0, 0);
      const staffEnd = new Date(year, month - 1, day, sEndH, sEndM, 0, 0);

      // Check if service fits within staff working hours
      if (slotStartDate < staffStart || slotEndDate > staffEnd) {
        continue;
      }

      // Check if overlaps with time off
      const hasTimeOff = staff.timeOff.some((to) => {
        const toStart = new Date(to.startAt).getTime();
        const toEnd = new Date(to.endAt).getTime();
        return toStart < slotEndDate.getTime() && toEnd > slotStartDate.getTime();
      });

      if (hasTimeOff) {
        continue;
      }

      // Check if overlaps with existing active bookings
      const hasBookingOverlap = staff.existingBookings.some((booking) => {
        // Ignored if cancelled
        if (booking.status === "cancelled" || booking.status === "no_show") {
          return false;
        }

        // If hold has expired, it does not block the slot
        if (
          booking.status === "pending" &&
          booking.holdExpiresAt &&
          new Date(booking.holdExpiresAt).getTime() < now.getTime()
        ) {
          return false;
        }

        const bStart = new Date(booking.startAt).getTime();
        // Add buffer if configured
        const bEnd = new Date(booking.endAt).getTime() + bufferMin * 60 * 1000;

        return bStart < slotEndDate.getTime() && bEnd > slotStartDate.getTime();
      });

      if (!hasBookingOverlap) {
        availableBarbers.push({
          id: staff.staffId,
          name: staff.staffName,
        });
      }
    }

    if (availableBarbers.length > 0) {
      slots.push({
        startAt: slotStartDate.toISOString(),
        endAt: slotEndDate.toISOString(),
        formattedTime: formatSlotTime(slotStartDate),
        availableBarbers,
        isAvailable: true,
      });
    }
  }

  return slots;
}
