"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  shop_id: string;
  staff_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_notes: string | null;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  payment_status: "unpaid" | "deposit_paid" | "paid" | "refunded";
  payment_method: string | null;
  price: number;
  deposit_amount: number;
  cancellation_code: string;
  staff?: { name: string; role: string };
  services?: { name: string; duration_min: number };
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
}

export default function OwnerTimelineDashboard() {
  const supabase = createClient();

  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Selected booking for drawer / modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInClientName, setWalkInClientName] = useState("");
  const [walkInClientPhone, setWalkInClientPhone] = useState("+233 ");
  const [walkInServiceId, setWalkInServiceId] = useState("");
  const [walkInStaffId, setWalkInStaffId] = useState("");
  const [walkInTime, setWalkInTime] = useState("12:00");
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // 1. Fetch initial demo shop & staff
  useEffect(() => {
    async function initShop() {
      // By default load the demo shop or the user's shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", "gentlemens-cut")
        .single();

      if (shopData) {
        setShop(shopData);

        const { data: stData } = await supabase
          .from("staff")
          .select("id, name, role")
          .eq("shop_id", shopData.id)
          .eq("is_active", true);

        if (stData) setStaffList(stData);

        const { data: svData } = await supabase
          .from("services")
          .select("id, name, duration_min, price")
          .eq("shop_id", shopData.id)
          .eq("is_active", true);

        if (svData) {
          setServices(svData);
          if (svData.length > 0) setWalkInServiceId(svData[0].id);
        }

        if (stData && stData.length > 0) {
          setWalkInStaffId(stData[0].id);
        }
      }
    }

    initShop();
  }, [supabase]);

  // 2. Fetch bookings for selected date & setup Realtime subscription
  useEffect(() => {
    if (!shop) return;

    async function loadBookings() {
      setLoading(true);
      const dayStart = `${date}T00:00:00Z`;
      const dayEnd = `${date}T23:59:59Z`;

      const { data } = await supabase
        .from("bookings")
        .select("*, staff(name, role), services(name, duration_min)")
        .eq("shop_id", shop.id)
        .gte("start_at", dayStart)
        .lte("start_at", dayEnd)
        .order("start_at", { ascending: true });

      setBookings((data as unknown as Booking[]) || []);
      setLoading(false);
    }

    loadBookings();

    // Supabase Realtime Subscription for live updates!
    const channel = supabase
      .channel("public-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `shop_id=eq.${shop.id}`,
        },
        () => {
          // Re-fetch bookings on any change
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop, date, supabase]);

  // Change date helpers
  const handleDateChange = (offset: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + offset);
    setDate(current.toISOString().split("T")[0]);
  };

  // Update booking status (Completed, Cancelled, No-show)
  const handleStatusUpdate = async (newStatus: "completed" | "cancelled" | "no_show" | "confirmed") => {
    if (!selectedBooking) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        status: newStatus,
        payment_status: newStatus === "completed" ? "paid" : selectedBooking.payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedBooking.id);

    if (!error) {
      setSelectedBooking({
        ...selectedBooking,
        status: newStatus,
        payment_status: newStatus === "completed" ? "paid" : selectedBooking.payment_status,
      });

      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: newStatus, payment_status: newStatus === "completed" ? "paid" : b.payment_status }
            : b
        )
      );
    }
    setUpdatingStatus(false);
  };

  // Create Manual Walk-In
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !walkInServiceId || !walkInStaffId || !walkInClientName.trim()) return;

    setWalkInSubmitting(true);
    const service = services.find((s) => s.id === walkInServiceId);
    if (!service) return;

    const [h, m] = walkInTime.split(":").map(Number);
    const [y, mon, d] = date.split("-").map(Number);

    const startAt = new Date(y, mon - 1, d, h, m, 0).toISOString();
    const endAt = new Date(new Date(startAt).getTime() + service.duration_min * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        shop_id: shop.id,
        staff_id: walkInStaffId,
        service_id: walkInServiceId,
        client_name: walkInClientName,
        client_phone: walkInClientPhone || "+233 24 000 0000",
        start_at: startAt,
        end_at: endAt,
        status: "confirmed",
        payment_status: "paid",
        payment_method: "pay_at_shop",
        price: service.price,
      })
      .select("*, staff(name, role), services(name, duration_min)")
      .single();

    if (error) {
      if (error.code === "23P01" || error.message.includes("bookings_no_overlap")) {
        alert("This chair already has an appointment overlapping that time!");
      } else {
        alert(`Failed to add walk-in: ${error.message}`);
      }
    } else if (data) {
      setBookings([...bookings, data as unknown as Booking]);
      setShowWalkInModal(false);
      setWalkInClientName("");
    }
    setWalkInSubmitting(false);
  };

  // Metrics
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ebebeb]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222222]">
              {shop?.name || "Shop Timeline"}
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              Live Chairs
            </span>
          </div>
          <p className="text-xs text-[#717171] mt-0.5">
            Realtime schedule overview for all barber stations
          </p>
        </div>

        {/* Date Switcher & Walk-In Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center bg-white border border-[#dddddd] rounded-xl px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleDateChange(-1)}
              className="p-1.5 rounded-lg hover:bg-[#f7f7f7] text-[#222222] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-[#222222] whitespace-nowrap">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => handleDateChange(1)}
              className="p-1.5 rounded-lg hover:bg-[#f7f7f7] text-[#222222] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowWalkInModal(true)}
            className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Walk-In</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider block">
            Today&apos;s Revenue
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#222222] mt-0.5 block">
            GHS {totalRevenue.toFixed(0)}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider block">
            Appointments
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#222222] mt-0.5 block">
            {activeBookings.length}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider block">
            Active Chairs
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 block">
            {staffList.length} Barbers
          </span>
        </div>
      </div>

      {/* Timeline Columns per Staff */}
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((st) => {
            const staffBookings = bookings.filter((b) => b.staff_id === st.id);

            return (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-[#ebebeb] p-4 flex flex-col shadow-xs min-w-0"
              >
                {/* Staff Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#222222] text-white flex items-center justify-center font-bold text-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#222222]">{st.name}</h3>
                      <span className="text-[11px] text-[#717171] block">{st.role}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f7f7f7] border border-[#ebebeb] text-[#717171]">
                    {staffBookings.length} booked
                  </span>
                </div>

                {/* Staff Appointment Cards */}
                <div className="space-y-2.5 flex-1 min-h-[300px]">
                  {staffBookings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 text-[#929292]">
                      <Clock className="w-7 h-7 stroke-[1.5] mb-1.5 opacity-60" />
                      <span className="text-xs font-semibold">Chair is Free</span>
                      <span className="text-[11px] mt-0.5">No bookings for this date</span>
                    </div>
                  ) : (
                    staffBookings.map((b) => {
                      const startTime = new Date(b.start_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      const endTime = new Date(b.end_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });

                      const isCancelled = b.status === "cancelled";
                      const isCompleted = b.status === "completed";

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                            isCancelled
                              ? "bg-red-50/50 border-red-100 opacity-60"
                              : isCompleted
                              ? "bg-neutral-50 border-[#ebebeb]"
                              : "bg-white border-[#ebebeb] hover:border-[#ff385c]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#ff385c]">
                              {startTime} - {endTime}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                b.status === "completed"
                                  ? "bg-neutral-200 text-neutral-800"
                                  : b.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : b.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-[#222222] mt-1">
                            {b.client_name}
                          </div>
                          <div className="text-xs text-[#717171] mt-0.5">
                            {b.services?.name} • GHS {b.price}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Detail Drawer / Modal (Stitch 14) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <span className="text-[10px] font-bold text-[#717171] uppercase tracking-wider block">
                  Booking Detail
                </span>
                <h3 className="text-lg font-bold text-[#222222]">{selectedBooking.client_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:bg-[#f7f7f7]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#fafafa] p-3.5 rounded-xl border border-[#ebebeb]">
              <div>
                <span className="text-[#717171] block">Service</span>
                <span className="font-bold text-[#222222]">{selectedBooking.services?.name}</span>
              </div>
              <div>
                <span className="text-[#717171] block">Barber Chair</span>
                <span className="font-bold text-[#222222]">{selectedBooking.staff?.name}</span>
              </div>
              <div>
                <span className="text-[#717171] block">Appointment Time</span>
                <span className="font-bold text-[#222222]">
                  {new Date(selectedBooking.start_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[#717171] block">Amount</span>
                <span className="font-bold text-[#222222]">
                  GHS {selectedBooking.price} ({selectedBooking.payment_status})
                </span>
              </div>
            </div>

            {selectedBooking.client_notes && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900">
                <strong>Client Notes:</strong> {selectedBooking.client_notes}
              </div>
            )}

            {/* Quick Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${selectedBooking.client_phone}`}
                className="py-2.5 px-3 rounded-xl border border-[#dddddd] hover:border-[#222222] text-xs font-semibold text-[#222222] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#ff385c]" />
                <span>Call Client</span>
              </a>

              <a
                href={`https://wa.me/${selectedBooking.client_phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Status Change Buttons */}
            <div className="pt-2 border-t border-[#f0f0f0] space-y-2">
              <span className="text-[11px] font-bold text-[#717171] uppercase tracking-wider block">
                Update Appointment Status
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusUpdate("completed")}
                  className="py-2.5 px-1 sm:px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Done</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusUpdate("no_show")}
                  className="py-2.5 px-1 sm:px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">No-Show</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusUpdate("cancelled")}
                  className="py-2.5 px-1 sm:px-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Booking Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="text-lg font-bold text-[#222222]">Add Walk-In Client</h3>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:bg-[#f7f7f7]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yaw Osei"
                  value={walkInClientName}
                  onChange={(e) => setWalkInClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+233 24 000 0000"
                  value={walkInClientPhone}
                  onChange={(e) => setWalkInClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#222222] mb-1">Barber Chair *</label>
                  <select
                    value={walkInStaffId}
                    onChange={(e) => setWalkInStaffId(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#dddddd] bg-white focus:outline-none focus:border-[#ff385c]"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#222222] mb-1">Service *</label>
                  <select
                    value={walkInServiceId}
                    onChange={(e) => setWalkInServiceId(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#dddddd] bg-white focus:outline-none focus:border-[#ff385c]"
                  >
                    {services.map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name} (GHS {sv.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={walkInTime}
                  onChange={(e) => setWalkInTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                />
              </div>

              <button
                type="submit"
                disabled={walkInSubmitting}
                className="w-full py-3 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-sm shadow-sm transition-all mt-4 disabled:opacity-50"
              >
                {walkInSubmitting ? "Adding..." : "Confirm Walk-In Seat"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
