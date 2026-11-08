"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Save, ExternalLink, ShieldAlert, Store, Clock } from "lucide-react";
import { LocationFields } from "@/components/location/location-fields";
import { EMPTY_LOCATION, locationError, locationPayload } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";
import { getCurrentShop } from "@/lib/auth/client-shop";

export default function ShopSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Settings State
  const [shopId, setShopId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState({ ...EMPTY_LOCATION });
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [depositType, setDepositType] = useState<"none" | "fixed" | "percentage">("fixed");
  const [depositValue, setDepositValue] = useState(30);
  const [allowPayAtShop, setAllowPayAtShop] = useState(true);
  const [cancellationHours, setCancellationHours] = useState(2);

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      const data = await getCurrentShop(supabase);

      if (data) {
        setShopId(data.id);
        setName(data.name);
        setSlug(data.slug);
        setTagline(data.tagline || "");
        setLocation({ city: data.city, address: data.address, region: data.region || "", latitude: data.latitude ?? null, longitude: data.longitude ?? null });
        setLocationConfirmed(true);
        setPhone(data.phone);
        setInstagram(data.instagram || "");
        setDepositType(data.deposit_type === "fixed" || data.deposit_type === "percentage" ? data.deposit_type : "none");
        setDepositValue(data.deposit_value);
        setAllowPayAtShop(data.allow_pay_at_shop);
        setCancellationHours(data.cancellation_hours);
      }
      setLoading(false);
    }

    loadShop();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const locationValidation = locationError(location);
    if (locationValidation || !locationConfirmed) { alert(locationValidation || "Confirm your shop’s location details."); return; }
    setSaving(true);
    setSuccessMsg(false);

    const { error } = await supabase
      .from("shops")
      .update({
        name,
        tagline: tagline.trim() || null,
        ...locationPayload(location),
        phone,
        instagram: instagram.trim() || null,
        deposit_type: depositType,
        deposit_value: depositType === "none" ? 0 : Number(depositValue),
        allow_pay_at_shop: allowPayAtShop,
        cancellation_hours: Number(cancellationHours),
        updated_at: new Date().toISOString(),
      })
      .eq("id", shopId);

    if (!error) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  const copyBookingLink = () => {
    if (!slug) return;
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Shop Settings & Policies
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure deposits, cancellation rules, and your public shop link
        </p>
      </div>

      {/* Share Booking Link Box */}
      <div className="my-6 p-4 rounded-2xl bg-card border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">
            Public Booking Link
          </span>
          <span className="text-xs sm:text-sm font-semibold text-foreground mt-0.5 block break-all">
            {slug
              ? (typeof window !== "undefined" ? `${window.location.origin}/book/${slug}` : `/book/${slug}`)
              : loading
              ? "Loading booking link..."
              : "No shop configured yet"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyBookingLink}
            disabled={!slug}
            className="py-2 px-3 rounded-xl border border-input hover:border-[#222222] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <a
            href={slug ? `/book/${slug}` : "#"}
            target={slug ? "_blank" : undefined}
            rel="noreferrer"
            className={`py-2 px-3 rounded-xl bg-[#222222] text-white hover:bg-black text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              !slug ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Portal</span>
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Shop settings successfully saved!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Deposit Policy */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>No-Show Protection & Deposits</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Deposit Rule
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setDepositType("none")}
                className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                  depositType === "none"
                    ? "border-primary bg-primary/5 font-bold text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                <div className="text-xs truncate">No Deposit</div>
                <div className="text-[10px] opacity-70 truncate">Pay in shop</div>
              </button>

              <button
                type="button"
                onClick={() => setDepositType("fixed")}
                className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                  depositType === "fixed"
                    ? "border-primary bg-primary/5 font-bold text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                <div className="text-xs truncate">Fixed</div>
                <div className="text-[10px] opacity-70 truncate">Flat GHS</div>
              </button>

              <button
                type="button"
                onClick={() => setDepositType("percentage")}
                className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                  depositType === "percentage"
                    ? "border-primary bg-primary/5 font-bold text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                <div className="text-xs truncate">Percentage</div>
                <div className="text-[10px] opacity-70 truncate">% of cut</div>
              </button>
            </div>
          </div>

          {depositType !== "none" && (
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                {depositType === "fixed" ? "Deposit Value (GHS)" : "Deposit Percentage (%)"}
              </label>
              <input
                type="number"
                value={depositValue}
                onChange={(e) => setDepositValue(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2 rounded-xl border border-input text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Allow &apos;Pay at Shop&apos;
              </span>
              <span className="text-[11px] text-muted-foreground">
                Clients can choose to skip MoMo and pay directly at the chair
              </span>
            </div>
            <input
              type="checkbox"
              checked={allowPayAtShop}
              onChange={(e) => setAllowPayAtShop(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Cancellation Window */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Cancellation Policy Window</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Clients can cancel their appointment online if it is at least this many hours before.
          </p>

          <select
            value={cancellationHours}
            onChange={(e) => setCancellationHours(Number(e.target.value))}
            className="w-full max-w-xs px-3 py-2 rounded-xl border border-input text-xs bg-card focus:outline-none focus:border-primary"
          >
            <option value={1}>At least 1 hour before</option>
            <option value={2}>At least 2 hours before (Standard)</option>
            <option value={4}>At least 4 hours before</option>
            <option value={12}>At least 12 hours before</option>
            <option value={24}>At least 24 hours before</option>
          </select>
        </div>

        {/* Shop Information */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3 text-xs">
          <h2 className="text-base font-bold text-foreground">Shop Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input focus:outline-none focus:border-primary"
              />
            </div>



            <div>
              <label className="block font-semibold text-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Instagram Handle</label>
              <input
                type="text"
                placeholder="@gentlemenscut_gh"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input focus:outline-none focus:border-primary"
              />
            </div>

            <LocationFields value={location} onChange={setLocation} confirmed={locationConfirmed} onConfirmedChange={setLocationConfirmed} />

            <div className="sm:col-span-2">
              <label className="block font-semibold text-foreground mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Shop Policies"}</span>
        </button>
      </form>
    </div>
  );
}
