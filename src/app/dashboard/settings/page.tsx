"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Save, ExternalLink, ShieldAlert, Store, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Accra");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [depositType, setDepositType] = useState<"none" | "fixed" | "percentage">("fixed");
  const [depositValue, setDepositValue] = useState(30);
  const [allowPayAtShop, setAllowPayAtShop] = useState(true);
  const [cancellationHours, setCancellationHours] = useState(2);

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", "gentlemens-cut")
        .single();

      if (data) {
        setShopId(data.id);
        setName(data.name);
        setSlug(data.slug);
        setTagline(data.tagline || "");
        setAddress(data.address);
        setCity(data.city);
        setPhone(data.phone);
        setInstagram(data.instagram || "");
        setDepositType(data.deposit_type as any);
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

    setSaving(true);
    setSuccessMsg(false);

    const { error } = await supabase
      .from("shops")
      .update({
        name,
        tagline: tagline.trim() || null,
        address,
        city,
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
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="pb-6 border-b border-[#ebebeb]">
        <h1 className="text-2xl font-bold tracking-tight text-[#222222]">
          Shop Settings & Policies
        </h1>
        <p className="text-xs text-[#717171] mt-0.5">
          Configure deposits, cancellation rules, and your public shop link
        </p>
      </div>

      {/* Share Booking Link Box */}
      <div className="my-6 p-4 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#ff385c] uppercase tracking-wider block">
            Public Booking Link
          </span>
          <span className="text-sm font-semibold text-[#222222] mt-0.5 block">
            {typeof window !== "undefined" ? `${window.location.origin}/book/${slug}` : `/book/${slug}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyBookingLink}
            className="py-2 px-3 rounded-xl border border-[#dddddd] hover:border-[#222222] text-xs font-semibold text-[#222222] flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <a
            href={`/book/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-[#222222] text-white hover:bg-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
        <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#ff385c]" />
            <span>No-Show Protection & Deposits</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider">
              Deposit Rule
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDepositType("none")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  depositType === "none"
                    ? "border-[#ff385c] bg-[#ff385c]/5 font-bold text-[#ff385c]"
                    : "border-[#dddddd] text-[#717171]"
                }`}
              >
                <div className="text-xs">No Deposit</div>
                <div className="text-[10px] opacity-70">Pay in shop</div>
              </button>

              <button
                type="button"
                onClick={() => setDepositType("fixed")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  depositType === "fixed"
                    ? "border-[#ff385c] bg-[#ff385c]/5 font-bold text-[#ff385c]"
                    : "border-[#dddddd] text-[#717171]"
                }`}
              >
                <div className="text-xs">Fixed Amount</div>
                <div className="text-[10px] opacity-70">Flat GHS</div>
              </button>

              <button
                type="button"
                onClick={() => setDepositType("percentage")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  depositType === "percentage"
                    ? "border-[#ff385c] bg-[#ff385c]/5 font-bold text-[#ff385c]"
                    : "border-[#dddddd] text-[#717171]"
                }`}
              >
                <div className="text-xs">Percentage</div>
                <div className="text-[10px] opacity-70">% of cut</div>
              </button>
            </div>
          </div>

          {depositType !== "none" && (
            <div>
              <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1">
                {depositType === "fixed" ? "Deposit Value (GHS)" : "Deposit Percentage (%)"}
              </label>
              <input
                type="number"
                value={depositValue}
                onChange={(e) => setDepositValue(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c]"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
            <div>
              <span className="text-xs font-bold text-[#222222] block">
                Allow &apos;Pay at Shop&apos;
              </span>
              <span className="text-[11px] text-[#717171]">
                Clients can choose to skip MoMo and pay directly at the chair
              </span>
            </div>
            <input
              type="checkbox"
              checked={allowPayAtShop}
              onChange={(e) => setAllowPayAtShop(e.target.checked)}
              className="w-5 h-5 rounded text-[#ff385c] focus:ring-[#ff385c]"
            />
          </div>
        </div>

        {/* Cancellation Window */}
        <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff385c]" />
            <span>Cancellation Policy Window</span>
          </h2>
          <p className="text-xs text-[#717171]">
            Clients can cancel their appointment online if it is at least this many hours before.
          </p>

          <select
            value={cancellationHours}
            onChange={(e) => setCancellationHours(Number(e.target.value))}
            className="w-full max-w-xs px-3 py-2 rounded-xl border border-[#dddddd] text-xs bg-white focus:outline-none focus:border-[#ff385c]"
          >
            <option value={1}>At least 1 hour before</option>
            <option value={2}>At least 2 hours before (Standard)</option>
            <option value={4}>At least 4 hours before</option>
            <option value={12}>At least 12 hours before</option>
            <option value={24}>At least 24 hours before</option>
          </select>
        </div>

        {/* Shop Information */}
        <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs space-y-3 text-xs">
          <h2 className="text-base font-bold text-[#222222]">Shop Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#222222] mb-1">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] bg-white focus:outline-none focus:border-[#ff385c]"
              >
                <option value="Accra">Accra</option>
                <option value="Kumasi">Kumasi</option>
                <option value="Tema">Tema</option>
                <option value="Takoradi">Takoradi</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">Instagram Handle</label>
              <input
                type="text"
                placeholder="@gentlemenscut_gh"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#222222] mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#222222] mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-6 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Shop Policies"}</span>
        </button>
      </form>
    </div>
  );
}
