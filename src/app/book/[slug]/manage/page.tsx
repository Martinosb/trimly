"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  ArrowLeft,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BookingDetail {
  id: string;
  client_name: string;
  client_phone: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
  price: number;
  deposit_amount: number;
  cancellation_code: string;
  staff: { name: string; role: string; phone: string | null };
  services: { name: string; duration_min: number };
  shops: {
    name: string;
    slug: string;
    phone: string;
    address: string;
    city: string;
    cancellation_hours: number;
  };
}

function ManageBookingContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const supabase = createClient();

  const fetchBooking = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("bookings")
      .select("*, staff(name, role, phone), services(name, duration_min), shops(name, slug, phone, address, city, cancellation_hours)")
      .eq("cancellation_code", searchCode.trim().toUpperCase())
      .maybeSingle();

    if (err || !data) {
      setError("No booking found with this reference code. Please verify and try again.");
      setBooking(null);
    } else {
      setBooking(data as unknown as BookingDetail);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialCode) {
      fetchBooking(initialCode);
    }
  }, [initialCode]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirmed = confirm("Are you sure you want to cancel this appointment?");
    if (!confirmed) return;

    setCancelling(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationCode: booking.cancellation_code,
          reason: cancelReason || "Cancelled by client online",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel appointment");
      }

      setCancelSuccess(true);
      setBooking({
        ...booking,
        status: "cancelled",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-0 sm:p-4 font-sans text-[#222222]">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden border border-[#ebebeb] relative">
        {/* Header */}
        <header className="px-5 pt-4 pb-3 border-b border-[#f0f0f0] flex items-center justify-between sticky top-0 bg-white z-10">
          <Link
            href={`/book/${slug}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#f7f7f7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-bold text-sm text-[#222222]">Manage Booking</span>
          <div className="w-8" />
        </header>

        <main className="p-5 flex-1 space-y-4">
          {/* Search by code if not preloaded */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider">
              Booking Reference Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. YAW789"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dddddd] text-sm uppercase font-mono font-bold tracking-wider focus:outline-none focus:border-[#ff385c]"
              />
              <button
                type="button"
                onClick={() => fetchBooking(code)}
                disabled={loading || !code.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#222222] text-white text-xs font-bold hover:bg-black transition-colors disabled:opacity-40"
              >
                {loading ? "..." : "Lookup"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {cancelSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your appointment has been successfully cancelled and the time slot is now released.</span>
            </div>
          )}

          {booking && (
            <div className="space-y-4 pt-2">
              {/* Status Header Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  booking.status === "cancelled"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : booking.status === "completed"
                    ? "bg-neutral-100 border-neutral-200 text-neutral-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {booking.status === "cancelled" ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block">
                      Status: {booking.status}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Ref: #{booking.cancellation_code}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold">
                  {booking.payment_status === "paid"
                    ? "Paid"
                    : booking.payment_status === "deposit_paid"
                    ? `Deposit (GHS ${booking.deposit_amount})`
                    : "Unpaid"}
                </span>
              </div>

              {/* Appointment Card */}
              <div className="bg-[#fafafa] border border-[#ebebeb] rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wider block">
                    Service
                  </span>
                  <span className="font-bold text-sm text-[#222222]">
                    {booking.services?.name} ({booking.services?.duration_min} mins)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#717171] block">Barber</span>
                    <span className="font-semibold text-[#222222]">{booking.staff?.name}</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Total Price</span>
                    <span className="font-semibold text-[#222222]">GHS {booking.price}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#717171] block">Date & Time</span>
                    <span className="font-semibold text-[#222222]">
                      {new Date(booking.start_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {new Date(booking.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#717171] block">Shop Location</span>
                    <span className="font-semibold text-[#222222]">{booking.shops?.address}, {booking.shops?.city}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy Box & Button */}
              {booking.status !== "cancelled" && booking.status !== "completed" && (
                <div className="border border-[#ebebeb] rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-[#717171]">
                    <Clock className="w-4 h-4 text-[#ff385c] shrink-0 mt-0.5" />
                    <span>
                      Free cancellation policy: Cancellations must be made at least{" "}
                      <strong className="text-[#222222]">
                        {booking.shops?.cancellation_hours ?? 2} hour(s)
                      </strong>{" "}
                      before your scheduled time.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#717171] mb-1">
                      Reason for cancelling (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule conflict"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleCancelBooking}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Appointment"}
                  </button>
                </div>
              )}

              {/* Shop Contact */}
              <div className="p-3 bg-[#fafafa] rounded-xl border border-[#ebebeb] flex items-center justify-between text-xs">
                <span className="text-[#717171]">Need to talk to the shop?</span>
                <a
                  href={`tel:${booking.shops?.phone}`}
                  className="font-bold text-[#ff385c] flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Shop
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ManageBookingPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ManageBookingContent {...props} />
    </React.Suspense>
  );
}
