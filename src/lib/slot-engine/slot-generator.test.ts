import { describe, it, expect } from "vitest";
import { calculateAvailableSlots } from "./slot-generator";
import { StaffScheduleRecord } from "./types";

describe("Slot Generator - calculateAvailableSlots", () => {
  const mockStaffSchedules: StaffScheduleRecord[] = [
    {
      staffId: "barber-1",
      staffName: "Kojo Mensah",
      isWorkingToday: true,
      workStart: "09:00",
      workEnd: "12:00", // 3 hours window: 09:00 to 12:00
      timeOff: [],
      existingBookings: [],
    },
    {
      staffId: "barber-2",
      staffName: "Kwame Asante",
      isWorkingToday: true,
      workStart: "10:00",
      workEnd: "13:00", // 3 hours window: 10:00 to 13:00
      timeOff: [],
      existingBookings: [],
    },
  ];

  it("generates correct slots for a 45-minute service with 15-minute intervals", () => {
    const slots = calculateAvailableSlots({
      date: "2026-10-15",
      serviceDurationMin: 45,
      intervalMin: 15,
      staffSchedules: [mockStaffSchedules[0]], // Kojo: 09:00 to 12:00
      now: new Date("2026-10-14T00:00:00Z"),
    });

    // From 09:00 to 12:00, last possible 45-min start is 11:15 (ends 12:00)
    // 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 11:00, 11:15 = 10 slots
    expect(slots.length).toBe(10);
    expect(slots[0].formattedTime).toBe("9:00 AM");
    expect(slots[slots.length - 1].formattedTime).toBe("11:15 AM");
    expect(slots[0].availableBarbers[0].name).toBe("Kojo Mensah");
  });

  it("correctly blocks slots that overlap with an existing confirmed booking", () => {
    const staffWithBooking: StaffScheduleRecord = {
      ...mockStaffSchedules[0],
      existingBookings: [
        {
          startAt: new Date(2026, 9, 15, 10, 0, 0).toISOString(),
          endAt: new Date(2026, 9, 15, 10, 45, 0).toISOString(),
          status: "confirmed",
        },
      ],
    };

    const slots = calculateAvailableSlots({
      date: "2026-10-15",
      serviceDurationMin: 45,
      intervalMin: 15,
      staffSchedules: [staffWithBooking],
      now: new Date("2026-10-14T00:00:00Z"),
    });

    // Slots overlapping 10:00 to 10:45:
    // 09:30 (ends 10:15) overlaps!
    // 09:45 (ends 10:30) overlaps!
    // 10:00 (ends 10:45) overlaps!
    // 10:15 (ends 11:00) overlaps!
    // 10:30 (ends 11:15) overlaps!
    // Available remaining should NOT include 09:30, 09:45, 10:00, 10:15, 10:30
    const times = slots.map((s) => s.formattedTime);
    expect(times).not.toContain("9:30 AM");
    expect(times).not.toContain("9:45 AM");
    expect(times).not.toContain("10:00 AM");
    expect(times).not.toContain("10:15 AM");
    expect(times).not.toContain("10:30 AM");

    // 09:00 (ends 09:45) does not overlap
    expect(times).toContain("9:00 AM");
    // 09:15 (ends 10:00) does not overlap (ends exactly when booking starts)
    expect(times).toContain("9:15 AM");
    // 10:45 (ends 11:30) does not overlap (starts exactly when booking ends)
    expect(times).toContain("10:45 AM");
  });

  it("ignores expired holds so slot remains bookable", () => {
    const pastHoldTime = new Date("2026-10-15T09:15:00Z").toISOString();
    const evaluationTime = new Date("2026-10-15T09:20:00Z");

    const staffWithExpiredHold: StaffScheduleRecord = {
      ...mockStaffSchedules[0],
      existingBookings: [
        {
          startAt: new Date(2026, 9, 15, 10, 0, 0).toISOString(),
          endAt: new Date(2026, 9, 15, 10, 45, 0).toISOString(),
          status: "pending",
          holdExpiresAt: pastHoldTime, // Expired 5 minutes before evaluation time
        },
      ],
    };

    const slots = calculateAvailableSlots({
      date: "2026-10-15",
      serviceDurationMin: 45,
      intervalMin: 15,
      staffSchedules: [staffWithExpiredHold],
      now: evaluationTime,
    });

    const times = slots.map((s) => s.formattedTime);
    // Because the hold expired, 10:00 AM is available!
    expect(times).toContain("10:00 AM");
  });

  it("handles 'Any Available' by combining availability across multiple staff", () => {
    // Kojo has a booking at 10:00 AM, but Kwame is free at 10:00 AM
    const kojoWithBooking: StaffScheduleRecord = {
      ...mockStaffSchedules[0],
      existingBookings: [
        {
          startAt: new Date(2026, 9, 15, 10, 0, 0).toISOString(),
          endAt: new Date(2026, 9, 15, 10, 45, 0).toISOString(),
          status: "confirmed",
        },
      ],
    };

    const slots = calculateAvailableSlots({
      date: "2026-10-15",
      serviceDurationMin: 45,
      intervalMin: 15,
      staffSchedules: [kojoWithBooking, mockStaffSchedules[1]],
      now: new Date("2026-10-14T00:00:00Z"),
    });

    const slotAt10 = slots.find((s) => s.formattedTime === "10:00 AM");
    expect(slotAt10).toBeDefined();
    // Only Kwame should be available at 10:00 AM
    expect(slotAt10?.availableBarbers.length).toBe(1);
    expect(slotAt10?.availableBarbers[0].name).toBe("Kwame Asante");
  });

  it("blocks slots when staff is on scheduled time off", () => {
    const staffWithTimeOff: StaffScheduleRecord = {
      ...mockStaffSchedules[0],
      timeOff: [
        {
          startAt: new Date(2026, 9, 15, 11, 0, 0).toISOString(),
          endAt: new Date(2026, 9, 15, 12, 0, 0).toISOString(),
        },
      ],
    };

    const slots = calculateAvailableSlots({
      date: "2026-10-15",
      serviceDurationMin: 45,
      intervalMin: 15,
      staffSchedules: [staffWithTimeOff],
      now: new Date("2026-10-14T00:00:00Z"),
    });

    const times = slots.map((s) => s.formattedTime);
    expect(times).not.toContain("11:00 AM");
    expect(times).not.toContain("11:15 AM");
  });
});
