"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  category: string;
  is_popular: boolean;
  is_active: boolean;
}

export default function ServicesManagementPage() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [price, setPrice] = useState(80);
  const [category, setCategory] = useState("Haircut");
  const [isPopular, setIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("slug", "gentlemens-cut")
        .single();

      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase
          .from("services")
          .select("*")
          .eq("shop_id", shop.id)
          .order("created_at", { ascending: true });

        if (data) setServices(data as Service[]);
      }
      setLoading(false);
    }

    loadServices();
  }, [supabase]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !name.trim()) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("services")
      .insert({
        shop_id: shopId,
        name,
        description: description.trim() || null,
        duration_min: Number(durationMin),
        price: Number(price),
        category,
        is_popular: isPopular,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setServices([...services, data as Service]);
      setShowAddForm(false);
      setName("");
      setDescription("");
      setPrice(80);
      setIsPopular(false);
    } else if (error) {
      alert(error.message);
    }
    setSaving(false);
  };

  const handleTogglePopular = async (svc: Service) => {
    const updated = !svc.is_popular;
    await supabase.from("services").update({ is_popular: updated }).eq("id", svc.id);
    setServices(services.map((s) => (s.id === svc.id ? { ...s, is_popular: updated } : s)));
  };

  const handleToggleActive = async (svc: Service) => {
    const updated = !svc.is_active;
    await supabase.from("services").update({ is_active: updated }).eq("id", svc.id);
    setServices(services.map((s) => (s.id === svc.id ? { ...s, is_active: updated } : s)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(services.filter((s) => s.id !== id));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#ebebeb]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222222]">
            Services & Pricing
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Configure treatments, durations, and pricing in GHS
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2.5 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Add Service Collapsible Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddService}
          className="my-6 p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-[#222222]">New Service</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#222222] mb-1">Service Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Skin Fade & Beard Trim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">Duration (Mins) *</label>
                <select
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-xl border border-[#dddddd] bg-white focus:outline-none focus:border-[#ff385c]"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={75}>75 mins</option>
                  <option value={90}>90 mins</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">Price (GHS) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#222222] mb-1">Description</label>
              <input
                type="text"
                placeholder="Includes hot towel razor finish and clarifying shampoo."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="popular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff385c] focus:ring-[#ff385c]"
              />
              <label htmlFor="popular" className="font-semibold text-xs text-[#222222] cursor-pointer">
                Mark as &apos;Popular&apos; badge
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-2 px-3 text-xs font-semibold text-[#717171] hover:text-[#222222]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      )}

      {/* Services List */}
      <div className="space-y-3 mt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#dddddd]">
            <p className="text-sm font-semibold text-[#222222]">No services created yet.</p>
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className={`p-4 rounded-2xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                svc.is_active ? "border-[#ebebeb]" : "border-[#ebebeb] opacity-50"
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-[#222222] truncate">{svc.name}</h3>
                  {svc.is_popular && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#ff385c]/10 text-[#ff385c] rounded-full flex items-center gap-1 shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Popular
                    </span>
                  )}
                  {!svc.is_active && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full shrink-0">
                      Archived
                    </span>
                  )}
                </div>
                {svc.description && (
                  <p className="text-xs text-[#717171]">{svc.description}</p>
                )}
                <div className="text-xs text-[#717171] flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {svc.duration_min} mins
                  </span>
                  <span>•</span>
                  <span className="font-bold text-[#222222]">GHS {svc.price}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f0f0] justify-end">
                <button
                  type="button"
                  onClick={() => handleTogglePopular(svc)}
                  title="Toggle Popular Badge"
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                    svc.is_popular
                      ? "border-[#ff385c] text-[#ff385c] bg-[#ff385c]/5"
                      : "border-[#dddddd] text-[#717171] hover:text-[#222222]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(svc)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#dddddd] text-xs font-medium text-[#717171] hover:text-[#222222]"
                >
                  {svc.is_active ? "Archive" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(svc.id)}
                  className="p-2 text-[#717171] hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
