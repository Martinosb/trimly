export interface BarberInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface TimeSlot {
  startAt: string; // ISO 8601 string
  endAt: string;   // ISO 8601 string
  formattedTime: string; // e.g. "09:30 AM" or "09:30"
  availableBarbers: BarberInfo[];
  isAvailable: boolean;
}

export interface StaffScheduleRecord {
  staffId: string;
  staffName: string;
  isWorkingToday: boolean;
  workStart: string; // e.g. "08:30"
  workEnd: string;   // e.g. "18:30"
  timeOff: {
    startAt: string;
    endAt: string;
  }[];
  existingBookings: {
    startAt: string;
    endAt: string;
    status: string;
    holdExpiresAt?: string | null;
  }[];
}

export interface SlotGenerationParams {
  date: string; // "YYYY-MM-DD"
  serviceDurationMin: number;
  intervalMin?: number; // default 15
  bufferMin?: number;   // default 0
  specificStaffId?: string | null;
  staffSchedules: StaffScheduleRecord[];
  now?: Date;
}

export interface BookingHoldParams {
  shopId: string;
  serviceId: string;
  staffId?: string | null; // null or 'any' for Any Available
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  clientNotes?: string | null;
  startAt: string; // ISO timestamp
  paymentMethod?: "momo_mtn" | "momo_voda" | "momo_airteltigo" | "card" | "pay_at_shop";
  holdMinutes?: number; // default 10
}

export interface BookingHoldResult {
  success: boolean;
  booking?: {
    id: string;
    shopId: string;
    staffId: string;
    staffName: string;
    serviceId: string;
    serviceName: string;
    startAt: string;
    endAt: string;
    price: number;
    depositAmount: number;
    status: string;
    holdExpiresAt: string;
    cancellationCode: string;
  };
  error?: string;
  code?: string;
}
