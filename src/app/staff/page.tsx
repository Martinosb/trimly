"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StaffBooking {
  id: string;
  client_name: string;
  client_phone: string;
  client_notes: string | null;
  start_at: string;
  end_at: string;
  status: string;
  price: number;
  payment_status: string;
  services: { name: string; duration_min: number };
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export default function StaffChairSchedulePage() {
  const supabase = createClient();

  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Staff Members
  useEffect(() => {
    async function loadBarbers() {
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("slug", "gentlemens-cut")
        .single();

      if (shop) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, name, role")
          .eq("shop_id", shop.id)
          .eq("is_active", true);

        if (staffData && staffData.length > 0) {
          setStaffList(staffData);
          setSelectedStaffId(staffData[0].id);
        }
      }
    }
    loadBarbers();
  }, [supabase]);

  // 2. Fetch bookings for this staff member & date
  useEffect(() => {
    if (!selectedStaffId) return;

    async function loadSchedule() {
      setLoading(true);
      const dayStart = `${date}T00:00:00Z`;
      const dayEnd = `${date}T23:59:59Z`;

      const { data } = await supabase
        .from("bookings")
        .select("id, client_name, client_phone, client_notes, start_at, end_at, status, price, payment_status, services(name, duration_min)")
        .eq("staff_id", selectedStaffId)
        .gte("start_at", dayStart)
        .lte("start_at", dayEnd)
        .order("start_at", { ascending: true });

      setBookings((data as unknown as StaffBooking[]) || []);
      setLoading(false);
    }

    loadSchedule();
  }, [selectedStaffId, date, supabase]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const currentStaff = staffList.find((s) => s.id === selectedStaffId);
  const completedCuts = bookings.filter((b) => b.status === "completed").length;
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-0 sm:p-4 font-sans text-[#222222]">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden border border-[#ebebeb] relative">
        {/* Header */}
        <header className="px-5 pt-4 pb-3 border-b border-[#f0f0f0] flex items-center justify-between sticky top-0 bg-white z-10">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:bg-[#f7f7f7] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {/* Barber Switcher */}
          <div className="text-center min-w-0 px-1">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="font-bold text-sm bg-transparent border-0 focus:outline-none cursor-pointer text-center text-[#222222] max-w-[160px] sm:max-w-xs truncate"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Chair Active
            </span>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#ff385c] hover:underline shrink-0"
          >
            Manager
          </Link>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-5 flex-1 space-y-4 overflow-y-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl">
              <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider block">
                Cuts Completed
              </span>
              <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                {completedCuts}
              </span>
            </div>

            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl">
              <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider block">
                Remaining Today
              </span>
              <span className="text-xl font-black text-[#222222] mt-0.5 block">
                {upcomingBookings.length}
              </span>
            </div>
          </div>

          {/* Upcoming Next Client Banner if exists */}
          {upcomingBookings.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#ff385c]/5 border border-[#ff385c]/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff385c] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Next In Chair
                </span>
                <span className="text-xs font-bold text-[#222222]">
                  {new Date(upcomingBookings[0].start_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-[#222222]">
                  {upcomingBookings[0].client_name}
                </h4>
                <p className="text-xs text-[#717171]">
                  {upcomingBookings[0].services?.name} • {upcomingBookings[0].services?.duration_min} mins
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(upcomingBookings[0].id, "completed")}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Cut Done</span>
                </button>

                <a
                  href={`tel:${upcomingBookings[0].client_phone}`}
                  className="p-2 rounded-xl border border-[#dddddd] hover:border-[#222222] text-[#222222] flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Full Schedule List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-[#717171] uppercase tracking-wider block">
              Today&apos;s Appointments
            </span>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-[#f0f0f0] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 bg-[#fafafa] rounded-2xl border border-dashed border-[#dddddd]">
                <Clock className="w-8 h-8 text-[#929292] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#222222]">No appointments scheduled</p>
                <p className="text-xs text-[#717171] mt-0.5">Your chair is ready for walk-ins!</p>
              </div>
            ) : (
              bookings.map((b) => {
                const startTime = new Date(b.start_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const isCompleted = b.status === "completed";

                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCompleted
                        ? "bg-[#fafafa] border-[#ebebeb] opacity-60"
                        : "bg-white border-[#ebebeb]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#ff385c] block">
                          {startTime}
                        </span>
                        <h4 className="font-bold text-sm text-[#222222] mt-0.5">
                          {b.client_name}
                        </h4>
                        <span className="text-xs text-[#717171]">
                          {b.services?.name} • GHS {b.price}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCompleted && b.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, "completed")}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            b.status === "completed"
                              ? "bg-neutral-100 text-neutral-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
