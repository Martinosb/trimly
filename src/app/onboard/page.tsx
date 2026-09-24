"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  CreditCard,
  Copy,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

interface ServiceItem {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  category: string;
}

interface StaffItem {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1: Shop details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Accra");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("+233 ");
  const [tagline, setTagline] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Step 2: Services
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", name: "Classic Haircut & Wash", duration_min: 45, price: 100, category: "Haircut" },
    { id: "2", name: "Beard Sculpt & Razor Edge", duration_min: 30, price: 60, category: "Beard" },
    { id: "3", name: "The Complete VIP Package", duration_min: 75, price: 160, category: "Combo" },
  ]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(80);

  // Step 3: Staff
  const [staffList, setStaffList] = useState<StaffItem[]>([
    { id: "1", name: "Head Barber", role: "Owner & Master Barber", phone: "" },
  ]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Barber");

  // Step 4: Policy
  const [depositType, setDepositType] = useState<"none" | "fixed" | "percentage">("fixed");
  const [depositValue, setDepositValue] = useState(30);
  const [allowPayAtShop, setAllowPayAtShop] = useState(true);
  const [cancellationHours, setCancellationHours] = useState(2);

  // Final created shop
  const [createdShopSlug, setCreatedShopSlug] = useState("");

  // Auto-slugify shop name
  useEffect(() => {
    if (name && step === 1 && slugStatus === "idle") {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  }, [name, step, slugStatus]);

  // Check slug availability in database
  const checkSlugAvailability = async (candidateSlug: string) => {
    if (!candidateSlug || candidateSlug.length < 3) return;
    setSlugStatus("checking");
    const { data } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (data) {
      setSlugStatus("taken");
    } else {
      setSlugStatus("available");
    }
  };

  const handleAddService = () => {
    if (!newServiceName) return;
    setServices([
      ...services,
      {
        id: Math.random().toString(),
        name: newServiceName,
        duration_min: Number(newServiceDuration),
        price: Number(newServicePrice),
        category: "Haircut",
      },
    ]);
    setNewServiceName("");
    setNewServiceDuration(30);
    setNewServicePrice(80);
  };

  const handleRemoveService = (id: string) => {
    if (services.length <= 1) return;
    setServices(services.filter((s) => s.id !== id));
  };

  const handleAddStaff = () => {
    if (!newStaffName) return;
    setStaffList([
      ...staffList,
      {
        id: Math.random().toString(),
        name: newStaffName,
        role: newStaffRole,
        phone: "",
      },
    ]);
    setNewStaffName("");
    setNewStaffRole("Barber");
  };

  const handleRemoveStaff = (id: string) => {
    if (staffList.length <= 1) return;
    setStaffList(staffList.filter((s) => s.id !== id));
  };

  // Complete onboarding
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ownerId = user?.id || null;

      // 1. Insert Shop
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .insert({
          owner_id: ownerId,
          name,
          slug,
          city,
          address: address || "Accra, Ghana",
          phone: phone || "+233 24 000 0000",
          tagline: tagline || "Premier Grooming & Styling",
          deposit_type: depositType,
          deposit_value: depositType === "none" ? 0 : depositValue,
          allow_pay_at_shop: allowPayAtShop,
          cancellation_hours: cancellationHours,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      const shopId = shopData.id;

      // 2. Insert Services
      const servicesToInsert = services.map((s) => ({
        shop_id: shopId,
        name: s.name,
        duration_min: s.duration_min,
        price: s.price,
        category: s.category,
        is_active: true,
      }));

      const { data: insertedServices, error: servError } = await supabase
        .from("services")
        .insert(servicesToInsert)
        .select();

      if (servError) throw servError;

      // 3. Insert Staff
      const staffToInsert = staffList.map((st) => ({
        shop_id: shopId,
        name: st.name,
        role: st.role,
        is_active: true,
      }));

      const { data: insertedStaff, error: staffError } = await supabase
        .from("staff")
        .insert(staffToInsert)
        .select();

      if (staffError) throw staffError;

      // 4. Map Staff Services & Default Working Hours (Mon - Sat 08:30 - 19:30)
      if (insertedStaff && insertedServices) {
        const staffServicesList: { staff_id: string; service_id: string }[] = [];
        const hoursList: { staff_id: string; day_of_week: number; start_time: string; end_time: string; is_working: boolean }[] = [];

        for (const st of insertedStaff) {
          for (const sv of insertedServices) {
            staffServicesList.push({ staff_id: st.id, service_id: sv.id });
          }

          // Days 1 to 6 (Mon to Sat)
          for (let d = 1; d <= 6; d++) {
            hoursList.push({
              staff_id: st.id,
              day_of_week: d,
              start_time: "08:30:00",
              end_time: "19:30:00",
              is_working: true,
            });
          }
          // Sunday
          hoursList.push({
            staff_id: st.id,
            day_of_week: 0,
            start_time: "10:00:00",
            end_time: "16:00:00",
            is_working: false,
          });
        }

        await supabase.from("staff_services").insert(staffServicesList);
        await supabase.from("staff_hours").insert(hoursList);
      }

      setCreatedShopSlug(slug);
      setStep(5); // Success step
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to setup shop");
    } finally {
      setSubmitting(false);
    }
  };

  const copyBookingLink = () => {
    const url = `${window.location.origin}/book/${createdShopSlug || slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-0 sm:p-4 font-sans text-[#222222]">
      <div className="w-full max-w-xl bg-white min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden border border-[#ebebeb]">
        {/* Wizard Header */}
        <header className="px-6 pt-5 pb-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#222222]">Trimly</span>
              <span className="text-xs text-[#717171] block">Shop Setup Wizard</span>
            </div>
          </div>

          {step < 5 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#717171]">
              <span>Step {step} of 4</span>
            </div>
          )}
        </header>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="w-full bg-[#f0f0f0] h-1.5">
            <div
              className="bg-[#ff385c] h-1.5 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Wizard Body */}
        <main className="p-4 sm:p-6 flex-1">
          {/* STEP 1: Details & Slug */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#222222]">
                  Tell us about your shop
                </h2>
                <p className="text-xs text-[#717171] mt-1">
                  This is how clients will discover and book with you in Ghana.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kingsway Grooming Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                  Your Custom Booking Link *
                </label>
                <div className="flex items-center rounded-xl border border-[#dddddd] px-2.5 sm:px-3 py-2 bg-[#fcfcfc] focus-within:border-[#ff385c] min-w-0">
                  <span className="text-[11px] sm:text-xs text-[#717171] select-none shrink-0">trimly.cut/book/</span>
                  <input
                    type="text"
                    required
                    placeholder="my-shop"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setSlugStatus("idle");
                    }}
                    onBlur={() => checkSlugAvailability(slug)}
                    className="flex-1 min-w-0 bg-transparent text-xs font-medium text-[#222222] focus:outline-none px-1"
                  />
                  {slugStatus === "checking" && (
                    <span className="text-[11px] text-[#717171] animate-pulse shrink-0">Checking...</span>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5" /> Available
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-[11px] text-red-500 font-semibold shrink-0">Taken</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#dddddd] text-sm bg-white focus:outline-none focus:border-[#ff385c]"
                  >
                    <option value="Accra">Accra</option>
                    <option value="Kumasi">Kumasi</option>
                    <option value="Tema">Tema</option>
                    <option value="Takoradi">Takoradi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                    Phone / MoMo *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 24 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oxford Street, Osu, Near Total Energies"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crisp lines, sharp cuts, top-tier service."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Services */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#222222]">
                  Set your haircut & grooming services
                </h2>
                <p className="text-xs text-[#717171] mt-1">
                  Clients will pick from these services when booking their appointment.
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-3 rounded-xl border border-[#ebebeb] bg-[#fafafa] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-[#222222]">{svc.name}</div>
                      <div className="text-xs text-[#717171] flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" /> {svc.duration_min} mins
                        <span>•</span>
                        <span className="font-medium text-[#222222]">GHS {svc.price}</span>
                      </div>
                    </div>
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveService(svc.id)}
                        className="p-1.5 text-[#717171] hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Service Inline */}
              <div className="pt-3 border-t border-[#f0f0f0] space-y-2">
                <span className="text-xs font-semibold text-[#222222] uppercase tracking-wider block">
                  Add another service
                </span>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Service Name"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="col-span-12 sm:col-span-6 px-3 py-2 rounded-xl border border-[#dddddd] text-xs focus:outline-none focus:border-[#ff385c]"
                  />
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="col-span-6 sm:col-span-3 px-2 py-2 rounded-xl border border-[#dddddd] text-xs bg-white"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={75}>75 min</option>
                    <option value={90}>90 min</option>
                  </select>
                  <input
                    type="number"
                    placeholder="GHS"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="col-span-6 sm:col-span-3 px-2 py-2 rounded-xl border border-[#dddddd] text-xs focus:outline-none focus:border-[#ff385c]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#dddddd] hover:border-[#ff385c] text-xs font-semibold text-[#ff385c] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Service List
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Staff */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#222222]">
                  Add your barbers & staff
                </h2>
                <p className="text-xs text-[#717171] mt-1">
                  Each barber has their own calendar and chair schedule.
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl border border-[#ebebeb] bg-[#fafafa] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-[#222222]">{st.name}</div>
                      <div className="text-xs text-[#717171] mt-0.5">{st.role}</div>
                    </div>
                    {staffList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(st.id)}
                        className="p-1.5 text-[#717171] hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Barber */}
              <div className="pt-3 border-t border-[#f0f0f0] space-y-2">
                <span className="text-xs font-semibold text-[#222222] uppercase tracking-wider block">
                  Add team member
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Barber's Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#dddddd] text-xs focus:outline-none focus:border-[#ff385c]"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Senior Stylist)"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#dddddd] text-xs focus:outline-none focus:border-[#ff385c]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#dddddd] hover:border-[#ff385c] text-xs font-semibold text-[#ff385c] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Team Member
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Policy */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#222222]">
                  Booking & Deposit Policy
                </h2>
                <p className="text-xs text-[#717171] mt-1">
                  Cut down on no-shows with Mobile Money upfront deposits.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider">
                  Deposit Requirement
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositType("none")}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                      depositType === "none"
                        ? "border-[#ff385c] bg-[#ff385c]/5 font-semibold text-[#ff385c]"
                        : "border-[#dddddd] text-[#717171]"
                    }`}
                  >
                    <div className="text-xs sm:text-sm truncate">No Deposit</div>
                    <div className="text-[10px] mt-0.5 opacity-70 truncate">Pay in shop</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositType("fixed")}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                      depositType === "fixed"
                        ? "border-[#ff385c] bg-[#ff385c]/5 font-semibold text-[#ff385c]"
                        : "border-[#dddddd] text-[#717171]"
                    }`}
                  >
                    <div className="text-xs sm:text-sm truncate">Fixed</div>
                    <div className="text-[10px] mt-0.5 opacity-70 truncate">Flat amount</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositType("percentage")}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                      depositType === "percentage"
                        ? "border-[#ff385c] bg-[#ff385c]/5 font-semibold text-[#ff385c]"
                        : "border-[#dddddd] text-[#717171]"
                    }`}
                  >
                    <div className="text-xs sm:text-sm truncate">Percentage</div>
                    <div className="text-[10px] mt-0.5 opacity-70 truncate">% of service</div>
                  </button>
                </div>
              </div>

              {depositType !== "none" && (
                <div>
                  <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                    {depositType === "fixed" ? "Deposit Amount (GHS)" : "Deposit Percentage (%)"}
                  </label>
                  <input
                    type="number"
                    value={depositValue}
                    onChange={(e) => setDepositValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-between p-3 rounded-xl border border-[#ebebeb] bg-[#fafafa]">
                <div>
                  <div className="text-sm font-semibold text-[#222222]">Allow &apos;Pay at Shop&apos;</div>
                  <div className="text-xs text-[#717171]">Clients can reserve without paying MoMo upfront</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowPayAtShop}
                  onChange={(e) => setAllowPayAtShop(e.target.checked)}
                  className="w-5 h-5 rounded text-[#ff385c] focus:ring-[#ff385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                  Cancellation Policy Window
                </label>
                <select
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-sm bg-white focus:outline-none focus:border-[#ff385c]"
                >
                  <option value={1}>At least 1 hour before</option>
                  <option value={2}>At least 2 hours before (Recommended)</option>
                  <option value={4}>At least 4 hours before</option>
                  <option value={24}>At least 24 hours before</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: Success & Share Link */}
          {step === 5 && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-500">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#222222]">
                  Your shop is live on Trimly!
                </h2>
                <p className="text-sm text-[#717171] mt-1.5 max-w-sm mx-auto">
                  Share your link on Instagram, WhatsApp, and Google Maps to start receiving instant bookings.
                </p>
              </div>

              {/* Share Card */}
              <div className="bg-[#fafafa] border border-[#ebebeb] p-4 rounded-2xl max-w-md mx-auto text-left space-y-3">
                <span className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
                  Public Booking Link
                </span>
                <div className="flex items-center justify-between bg-white border border-[#dddddd] rounded-xl px-3 py-2.5">
                  <span className="text-xs font-medium text-[#222222] truncate pr-2">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/book/${createdShopSlug}`
                      : `/book/${createdShopSlug}`}
                  </span>
                  <button
                    type="button"
                    onClick={copyBookingLink}
                    className="p-1.5 rounded-lg text-[#ff385c] hover:bg-[#ff385c]/10 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-md mx-auto">
                <Link
                  href={`/book/${createdShopSlug}`}
                  target="_blank"
                  className="w-full py-3 px-4 rounded-xl border border-[#222222] hover:bg-[#f7f7f7] font-semibold text-sm text-[#222222] flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Preview Booking Portal</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Go to Owner Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </main>

        {/* Wizard Footer Navigation */}
        {step < 5 && (
          <footer className="px-6 py-4 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#222222] hover:bg-[#ebebeb] transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!name || !slug)) {
                    alert("Please fill in your shop name and custom booking link");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Finish Setup</span>
                    <Sparkles className="w-4 h-4" />
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
