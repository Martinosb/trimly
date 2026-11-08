"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Scissors,
  MapPin,
  Phone,
  Clock,
  Star,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Share2,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { directionsUrl } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";
import { renderPassCardToCanvas, savePassImageToDevice } from "@/lib/pass-card-renderer";

interface Shop {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  address: string;
  city: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  instagram: string | null;
  deposit_type: "none" | "fixed" | "percentage";
  deposit_value: number;
  allow_pay_at_shop: boolean;
  cancellation_hours: number;
  is_suspended: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  category: string;
  is_popular: boolean;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
}

interface TimeSlot {
  startAt: string;
  endAt: string;
  formattedTime: string;
  availableBarbers: { id: string; name: string }[];
}

export default function BookingPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Wizard state
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | "any">("any");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Slots state
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+233 ");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [paymentChoice, setPaymentChoice] = useState<"pay_at_shop" | "deposit_momo" | "full_momo">("pay_at_shop");
  const [momoProvider, setMomoProvider] = useState<"momo_mtn" | "momo_voda" | "momo_airteltigo">("momo_mtn");

  // Booking Execution
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    cancellationCode: string;
    startAt: string;
    endAt: string;
    staffName: string;
    serviceName: string;
    price: number;
    depositAmount: number;
    paymentStatus: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [hasSavedPass, setHasSavedPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // 1. Fetch initial shop data
  useEffect(() => {
    async function loadShopData() {
      setLoading(true);
      const { data: shopData, error: shopErr } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (shopErr || !shopData) {
        setShop(null);
        setLoading(false);
        return;
      }

      setShop(shopData as Shop);

      setPaymentChoice("pay_at_shop");

      // Fetch active services
      const { data: servData } = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("is_active", true)
        .order("is_popular", { ascending: false });

      if (servData) setServices(servData as Service[]);

      // Fetch active staff
      const { data: stData } = await supabase
        .from("staff")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("is_active", true);

      if (stData) setStaffList(stData as Staff[]);

      setLoading(false);
    }

    loadShopData();
  }, [slug, supabase]);

  // 2. Fetch Slots when Service, Staff, or Date changes
  useEffect(() => {
    if (!selectedService || bookingStep !== 3) return;

    const currentServiceId = selectedService.id;

    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const staffParam = selectedStaff === "any" ? "any" : selectedStaff.id;
        const res = await fetch(
          `/api/shops/${slug}/slots?serviceId=${currentServiceId}&staffId=${staffParam}&date=${selectedDate}`
        );
        const data = await res.json();
        if (data.slots) {
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots([]);
        }
      } catch (e) {
        console.error("Error loading slots:", e);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [slug, selectedService, selectedStaff, selectedDate, bookingStep]);

  // Date strip generation: Next 7 days
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    return { iso, dayName, dayNum, monthName };
  });

  // Calculate deposit value
  const calculateDeposit = (price: number) => {
    if (!shop || shop.deposit_type === "none") return 0;
    if (shop.deposit_type === "fixed") return Math.min(shop.deposit_value, price);
    return Math.round((price * shop.deposit_value) / 100);
  };

  // Submit Booking Hold & Confirmation
  const handleCompleteBooking = async () => {
    if (!shop || !selectedService || !selectedSlot) {
      setErrorMessage("Please complete all booking steps (service and time slot) first.");
      return;
    }
    if (!clientName.trim() || clientPhone.trim().length < 8) {
      setErrorMessage("Please enter your name and a valid phone number.");
      return;
    }

    if (!shop.allow_pay_at_shop) { setErrorMessage("Please contact this shop to book."); return; }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create Hold
      const holdRes = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          serviceId: selectedService.id,
          staffId: selectedStaff === "any" ? null : selectedStaff.id,
          clientName,
          clientPhone,
          clientEmail: clientEmail.trim() || null,
          clientNotes: clientNotes.trim() || null,
          startAt: selectedSlot.startAt,
          paymentMethod: paymentChoice === "pay_at_shop" ? "pay_at_shop" : momoProvider,
        }),
      });

      const holdData = await holdRes.json();

      if (!holdRes.ok || !holdData.success) {
        throw new Error(holdData.error || "Unable to reserve this slot.");
      }

      const booking = holdData.booking;
      // No client-reported payment success. Payment is collected by the shop.
      const paymentStatus = "unpaid";
      const paidAmount = 0;

      const confirmRes = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          cancellationCode: booking.cancellationCode,
          paymentMethod: paymentChoice === "pay_at_shop" ? "pay_at_shop" : momoProvider,
          paymentStatus,
          paidAmount,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error || "Unable to confirm your booking. Please try again.");
      }

      // Generate high-resolution QR Code pass
      const passUrl = `${window.location.origin}/book/${slug}/manage?code=${booking.cancellationCode}`;
      const qrUrl = await QRCode.toDataURL(passUrl, { width: 360, margin: 1 });
      setQrDataUrl(qrUrl);

      setConfirmedBooking({
        id: booking.id,
        cancellationCode: booking.cancellationCode,
        startAt: booking.startAt,
        endAt: booking.endAt,
        staffName: booking.staffName,
        serviceName: booking.serviceName,
        price: booking.price,
        depositAmount: paidAmount,
        paymentStatus,
      });

      if (typeof window !== "undefined") {
        const alreadySaved =
          localStorage.getItem(`gxstyl_pass_saved_${booking.cancellationCode}`) === "true";
        setHasSavedPass(alreadySaved);
      } else {
        setHasSavedPass(false);
      }

      setBookingStep(5);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePass = async () => {
    if (!confirmedBooking || !shop) return;
    setSavingPass(true);
    try {
      const canvas = await renderPassCardToCanvas({
        shopName: shop.name,
        shopAddress: shop.address,
        shopCity: shop.city,
        cancellationCode: confirmedBooking.cancellationCode,
        serviceName: confirmedBooking.serviceName,
        staffName: confirmedBooking.staffName,
        startAt: confirmedBooking.startAt,
        paymentStatus: confirmedBooking.paymentStatus,
        price: confirmedBooking.price,
        qrDataUrl,
      });

      const success = await savePassImageToDevice(canvas, confirmedBooking.cancellationCode);
      if (success) {
        setHasSavedPass(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`gxstyl_pass_saved_${confirmedBooking.cancellationCode}`, "true");
        }
      }
    } catch (err) {
      console.error("Failed to render or save pass image:", err);
      alert("Could not automatically save pass image. Please take a screenshot of your pass card.");
    } finally {
      setSavingPass(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-sm border border-border">
          <div className="w-16 h-16 rounded-full bg-[#f0f0f0] animate-pulse mx-auto" />
          <div className="h-6 w-3/4 bg-[#f0f0f0] rounded animate-pulse mx-auto" />
          <div className="h-4 w-1/2 bg-[#f0f0f0] rounded animate-pulse mx-auto" />
          <div className="space-y-3 pt-4">
            <div className="h-20 bg-background rounded-xl animate-pulse" />
            <div className="h-20 bg-background rounded-xl animate-pulse" />
            <div className="h-20 bg-background rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found
  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-sm">
          <Scissors className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground">Barber Shop Not Found</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            The shop you are looking for does not exist or has moved.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#222222] text-white text-sm font-semibold"
          >
            Go to Trimly Home
          </Link>
        </div>
      </div>
    );
  }

  // Suspended Shop (Matches PRD requirement for admin suspension)
  if (shop.is_suspended) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-md">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{shop.name} is Temporarily Unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            This barber shop is currently not taking new online bookings. Please check back later or contact the shop directly at {shop.phone}.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
          >
            Explore Other Barbers on Trimly
          </Link>
        </div>
      </div>
    );
  }

  const depositRequired = selectedService ? calculateDeposit(selectedService.price) : 0;
  const balanceAtShop = selectedService ? selectedService.price - depositRequired : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 sm:p-4 font-sans text-foreground">
      {/* Mobile-first App Shell matching Stitch 06-10 */}
      <div className="w-full max-w-md bg-card min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden border border-border relative">
        {/* Top Header */}
        <header className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-20">
          {bookingStep > 1 && bookingStep < 5 ? (
            <button
              type="button"
              aria-label="Previous step"
              onClick={() => setBookingStep((bookingStep - 1) as 1 | 2 | 3 | 4)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Trimly Home"
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
            >
              <Scissors className="w-4 h-4 text-primary rotate-45" />
            </Link>
          )}

          <div className="text-center">
            <span className="font-bold text-sm tracking-tight text-foreground block truncate max-w-[200px]">
              {shop.name}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> {[shop.city, shop.region, "Ghana"].filter(Boolean).join(", ")}
            </span>
            <a href={directionsUrl(shop)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-semibold underline">Get directions<span className="sr-only"> (opens in a new tab)</span></a>
          </div>

          <div className="w-8 flex justify-end">
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-foreground bg-background px-2 py-0.5 rounded-full border border-border">
              <Star className="w-3 h-3 fill-current text-amber-500" /> 4.9
            </span>
          </div>
        </header>

        {/* Step Indicator */}
        {bookingStep < 5 && (
          <div className="flex border-b border-border bg-muted text-[11px] sm:text-xs font-semibold">
            {[
              { step: 1, label: "Service" },
              { step: 2, label: "Barber" },
              { step: 3, label: "Time" },
              { step: 4, label: "Confirm" },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex-1 text-center py-2 border-b-2 transition-colors ${
                  bookingStep === item.step
                    ? "border-primary text-[#b00020] font-bold"
                    : bookingStep > item.step
                    ? "border-emerald-600 text-emerald-700 font-medium"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}

        {/* Scrollable Content Area */}
        <main className="p-5 flex-1 overflow-y-auto">
          {/* STEP 1: SERVICE SELECTION (Stitch 06) */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Select a Service
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick your treatment or styling package
                </p>
              </div>

              <div className="space-y-3">
                {services.map((svc) => {
                  const isSelected = selectedService?.id === svc.id;
                  return (
                    <div
                      key={svc.id}
                      onClick={() => {
                        setSelectedService(svc);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border bg-card hover:border-input"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{svc.name}</span>
                            {svc.is_popular && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-rose-100 text-[#9f1239] rounded-full border border-rose-200">
                                Popular
                              </span>
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {svc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {svc.duration_min} mins
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-foreground">
                            GHS {svc.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BARBER SELECTION (Stitch 07) */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Choose your Barber
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Book with your favourite specialist or pick fastest available
                </p>
              </div>

              {/* Any Available Option */}
              <div
                onClick={() => {
                  setSelectedStaff("any");
                  setSelectedSlot(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedStaff === "any"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-input"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>Any Available Barber</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Fastest
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assigns the first qualified barber with an open chair
                    </p>
                  </div>
                  {selectedStaff === "any" && (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Barbers */}
              <div className="space-y-3 pt-1">
                {staffList.map((st) => {
                  const isSelected = typeof selectedStaff === "object" && selectedStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSelectedStaff(st);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border bg-card hover:border-input"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#222222] text-white flex items-center justify-center font-bold text-base shrink-0">
                          {st.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-foreground">{st.name}</div>
                          <div className="text-xs text-primary font-medium">{st.role}</div>
                          {st.bio && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{st.bio}</p>}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME MATRIX (Stitch 08) */}
          {bookingStep === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Pick Date & Time
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live availability for {selectedStaff === "any" ? "Any Barber" : selectedStaff.name}
                </p>
              </div>

              {/* Date Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.iso;
                  return (
                    <button
                      key={opt.iso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(opt.iso);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center py-2.5 px-3.5 rounded-xl border shrink-0 transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-input"
                      }`}
                    >
                      <span className={`text-[10px] font-semibold uppercase ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                        {opt.dayName}
                      </span>
                      <span className="text-base font-black my-0.5">{opt.dayNum}</span>
                      <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                        {opt.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Slot Grid */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2.5">
                  Available Slots
                </span>

                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 py-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-11 bg-[#f0f0f0] rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-2xl border border-dashed border-input">
                    <Clock className="w-8 h-8 text-[#929292] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No available slots on this date</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Please pick another date above or select another barber.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.startAt === slot.startAt;
                      return (
                        <button
                          key={slot.startAt}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                              : "border-border bg-card text-foreground hover:border-[#222222] font-medium"
                          }`}
                        >
                          <span className="text-xs block">{slot.formattedTime}</span>
                          <span className={`text-[9px] block mt-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                            {slot.availableBarbers.length} chair{slot.availableBarbers.length > 1 ? "s" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CLIENT DETAILS & PAYMENT CHOICE (Stitch 09) */}
          {bookingStep === 4 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Client Details & Payment
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm your contact and choose payment method
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Booking Summary Pill */}
              <div className="p-3.5 bg-muted border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-foreground">{selectedService?.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {selectedSlot?.formattedTime} • {selectedStaff === "any" ? "Any Barber" : selectedStaff.name}
                  </div>
                </div>
                <div className="text-right font-black text-sm text-foreground">
                  GHS {selectedService?.price}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwesi Arthur"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Phone / MoMo Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 24 000 0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Email (for booking pass & calendar invite)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Notes for Barber (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Low skin fade, sensitive skin on neck"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted">
                <h3 className="font-semibold text-sm">{shop.allow_pay_at_shop ? "Reserve now. Pay at the shop." : "Please contact this shop to book."}</h3>
                <p className="text-sm text-muted-foreground mt-2">{shop.allow_pay_at_shop ? "No online payment is taken. You’ll pay your barber or stylist directly when you arrive." : "This shop requires an online deposit. Online payments are not available on Trimly yet."}</p>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION PASS (Stitch 10) */}
          {bookingStep === 5 && confirmedBooking && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Booking Confirmed!
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  We&apos;ve reserved your seat at {shop.name}.
                </p>
              </div>

              {/* Mandate Callout Banner */}
              {!hasSavedPass ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-amber-950">
                        Keep your booking pass handy
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Download your pass for easy check-in, even when you are offline. You can manage your appointment at any time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-emerald-950">
                        Booking Pass Saved to Device
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Your pass image is saved in your device photos / downloads. Show it to your barber when you arrive at {shop.name}.
                    </p>
                  </div>
                </div>
              )}

              {/* Boarding Pass Card */}
              <div className="bg-muted border border-border rounded-2xl p-4 text-left shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Booking Pass
                    </span>
                    <span className="font-mono text-sm font-black text-primary">
                      #{confirmedBooking.cancellationCode}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {confirmedBooking.paymentStatus === "paid"
                      ? "Paid in Full"
                      : confirmedBooking.paymentStatus === "deposit_paid"
                      ? "Deposit Paid"
                      : "Pay at Shop"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Service</span>
                    <span className="font-bold text-foreground">{confirmedBooking.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Barber</span>
                    <span className="font-bold text-foreground">{confirmedBooking.staffName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Date & Time</span>
                    <span className="font-bold text-foreground">
                      {new Date(confirmedBooking.startAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at {new Date(confirmedBooking.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Location</span>
                    <span className="font-bold text-foreground truncate block">{shop.address}</span>
                  </div>
                </div>

                {/* QR Code Container */}
                {qrDataUrl && (
                  <div className="pt-2 border-t border-dashed border-input text-center">
                    <img
                      src={qrDataUrl}
                      alt="Booking QR Code"
                      className="w-36 h-36 mx-auto rounded-lg border border-border p-1 bg-card"
                    />
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Show this pass to your barber upon arrival
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Primary Mandatory Save Pass Button */}
                {!hasSavedPass ? (
                  <button
                    type="button"
                    onClick={handleSavePass}
                    disabled={savingPass}
                    className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group ring-2 ring-primary/30 hover:ring-primary/60 cursor-pointer"
                  >
                    {savingPass ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
                        <span>Download booking pass</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSavePass}
                    disabled={savingPass}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingPass ? (
                      <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                        <span>Pass Saved to Photos • Download Again</span>
                      </>
                    )}
                  </button>
                )}

                <Link href={`/book/${slug}/manage?code=${confirmedBooking.cancellationCode}`} className="w-full min-h-11 py-3 px-4 rounded-lg border border-input text-foreground font-semibold text-sm flex items-center justify-center">Manage or cancel appointment</Link>

                {/* WhatsApp Share */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Booked my haircut at ${shop.name}! Ref: #${confirmedBooking.cancellationCode}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>
              </div>


            </div>
          )}
        </main>

        {/* Sticky Bottom Summary & CTA Bar */}
        {bookingStep < 5 && (
          <footer className="p-4 border-t border-border bg-card sticky bottom-0 z-20">
            {bookingStep === 1 && (
              <button
                type="button"
                disabled={!selectedService}
                onClick={() => setBookingStep(2)}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="truncate pr-2">
                  {selectedService ? `Continue with ${selectedService.name}` : "Select a Service to Continue"}
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            {bookingStep === 2 && (
              <button
                type="button"
                onClick={() => setBookingStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all flex items-center justify-between"
              >
                <span className="truncate pr-2">Continue to Date & Time</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            {bookingStep === 3 && (
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setBookingStep(4)}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="truncate pr-2">
                  {selectedSlot ? `Book for ${selectedSlot.formattedTime}` : "Select a Time Slot"}
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            {bookingStep === 4 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteBooking}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Reserve Slot</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
