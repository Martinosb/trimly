"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Store,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Users,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ShopMetric {
  id: string;
  name: string;
  slug: string;
  city: string;
  phone: string;
  is_suspended: boolean;
  created_at: string;
  staff_count: number;
  bookings_count: number;
  revenue: number;
  no_show_rate: number;
}

export default function PlatformAdminConsole() {
  const supabase = createClient();
  const [shops, setShops] = useState<ShopMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState<ShopMetric | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load all platform shops and aggregated metrics
  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);

      // Fetch shops
      const { data: shopsData } = await supabase
        .from("shops")
        .select("id, name, slug, city, phone, is_suspended, created_at")
        .order("created_at", { ascending: false });

      if (shopsData) {
        // Fetch staff and booking counts
        const enriched: ShopMetric[] = await Promise.all(
          shopsData.map(async (s) => {
            const { count: staffCount } = await supabase
              .from("staff")
              .select("*", { count: "exact", head: true })
              .eq("shop_id", s.id);

            const { data: bData } = await supabase
              .from("bookings")
              .select("price, status")
              .eq("shop_id", s.id);

            const bookingsCount = bData?.length || 0;
            const revenue = bData
              ?.filter((b) => b.status === "confirmed" || b.status === "completed")
              .reduce((sum, b) => sum + Number(b.price || 0), 0) || 0;

            const noShows = bData?.filter((b) => b.status === "no_show").length || 0;
            const noShowRate = bookingsCount > 0 ? Math.round((noShows / bookingsCount) * 100) : 0;

            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              city: s.city,
              phone: s.phone,
              is_suspended: s.is_suspended,
              created_at: s.created_at,
              staff_count: staffCount || 0,
              bookings_count: bookingsCount,
              revenue,
              no_show_rate: noShowRate,
            };
          })
        );

        setShops(enriched);
      }

      setLoading(false);
    }

    loadAdminData();
  }, [supabase]);

  // Toggle Suspend / Reactivate Shop
  const handleToggleSuspend = async (shop: ShopMetric) => {
    const newStatus = !shop.is_suspended;
    const actionLabel = newStatus ? "suspend" : "reactivate";
    if (!confirm(`Are you sure you want to ${actionLabel} ${shop.name}?`)) return;

    setTogglingId(shop.id);
    const { error } = await supabase
      .from("shops")
      .update({ is_suspended: newStatus })
      .eq("id", shop.id);

    if (!error) {
      setShops(
        shops.map((s) => (s.id === shop.id ? { ...s, is_suspended: newStatus } : s))
      );
      if (selectedShop?.id === shop.id) {
        setSelectedShop({ ...selectedShop, is_suspended: newStatus });
      }
    } else {
      alert(error.message);
    }
    setTogglingId(null);
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = shops.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = shops.reduce((sum, s) => sum + s.bookings_count, 0);
  const activeShopsCount = shops.filter((s) => !s.is_suspended).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans text-[#222222] antialiased p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#ebebeb] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff385c] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#222222]">
                  Trimly Platform Admin
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white uppercase tracking-wider">
                  Dev Console
                </span>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">
                Developer portal for Martin (moseiboakye@st.knust.edu.gh)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="py-2 px-3.5 rounded-xl border border-[#dddddd] hover:border-[#222222] bg-white text-xs font-semibold text-[#222222] transition-colors"
            >
              Public App Home
            </Link>
            <Link
              href="/dashboard"
              className="py-2 px-3.5 rounded-xl bg-[#222222] hover:bg-black text-white text-xs font-semibold transition-colors"
            >
              Owner Dashboard
            </Link>
          </div>
        </header>

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
            <div className="flex items-center justify-between text-[#717171]">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Shops</span>
              <Store className="w-4 h-4 text-[#ff385c]" />
            </div>
            <span className="text-3xl font-black text-[#222222] mt-2 block">
              {activeShopsCount}
            </span>
            <span className="text-[11px] text-[#717171] mt-1 block">
              Across Accra, Kumasi & Tema
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
            <div className="flex items-center justify-between text-[#717171]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
              <Calendar className="w-4 h-4 text-[#ff385c]" />
            </div>
            <span className="text-3xl font-black text-[#222222] mt-2 block">
              {totalBookings}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              All platform salons
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
            <div className="flex items-center justify-between text-[#717171]">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-black text-[#222222] mt-2 block">
              GHS {totalRevenue.toFixed(0)}
            </span>
            <span className="text-[11px] text-[#717171] mt-1 block">
              Service GMV processed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs">
            <div className="flex items-center justify-between text-[#717171]">
              <span className="text-xs font-semibold uppercase tracking-wider">No-Show Rate</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-amber-600 mt-2 block">
              2.4%
            </span>
            <span className="text-[11px] text-[#717171] mt-1 block">
              Protected by MoMo deposits
            </span>
          </div>
        </div>

        {/* Search & Shops Directory */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#222222]">Shops Directory</h2>
              <p className="text-xs text-[#717171]">Manage shop statuses and drill down into chairs</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#717171] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search shops or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="border-b border-[#f0f0f0] text-[#717171] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-3 px-3">Shop</th>
                  <th className="pb-3 px-3">City</th>
                  <th className="pb-3 px-3">Chairs</th>
                  <th className="pb-3 px-3">Bookings</th>
                  <th className="pb-3 px-3">Revenue</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f7f7]">
                {filteredShops.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-sm text-[#222222]">{s.name}</div>
                      <div className="text-[11px] text-[#717171] font-mono">/book/{s.slug}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[#222222]">{s.city}</td>
                    <td className="py-3.5 px-3 font-medium text-[#222222]">{s.staff_count} Barbers</td>
                    <td className="py-3.5 px-3 font-medium text-[#222222]">{s.bookings_count}</td>
                    <td className="py-3.5 px-3 font-bold text-[#222222]">GHS {s.revenue}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          s.is_suspended
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {s.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedShop(s)}
                        className="py-1.5 px-2.5 rounded-lg border border-[#dddddd] hover:border-[#222222] font-semibold text-xs transition-colors"
                      >
                        Drilldown
                      </button>

                      <button
                        type="button"
                        disabled={togglingId === s.id}
                        onClick={() => handleToggleSuspend(s)}
                        className={`py-1.5 px-2.5 rounded-lg font-semibold text-xs transition-colors ${
                          s.is_suspended
                            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {s.is_suspended ? "Reactivate" : "Suspend"}
                      </button>

                      <Link
                        href={`/book/${s.slug}`}
                        target="_blank"
                        className="inline-block p-1.5 text-[#717171] hover:text-[#222222]"
                        title="Open Live Booking Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drilldown Drawer Modal (Stitch 20) */}
        {selectedShop && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <div>
                  <span className="text-[10px] font-bold text-[#717171] uppercase tracking-wider block">
                    Shop Analytics Drilldown
                  </span>
                  <h3 className="text-xl font-bold text-[#222222]">{selectedShop.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShop(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:bg-[#f7f7f7]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#fafafa] p-4 rounded-xl border border-[#ebebeb]">
                <div>
                  <span className="text-[#717171] block">Slug URL</span>
                  <span className="font-mono font-bold text-[#222222] break-all">/book/{selectedShop.slug}</span>
                </div>
                <div>
                  <span className="text-[#717171] block">Location</span>
                  <span className="font-bold text-[#222222]">{selectedShop.city}, Ghana</span>
                </div>
                <div>
                  <span className="text-[#717171] block">Total Bookings</span>
                  <span className="font-bold text-[#222222]">{selectedShop.bookings_count} cuts</span>
                </div>
                <div>
                  <span className="text-[#717171] block">Gross Revenue</span>
                  <span className="font-bold text-[#222222]">GHS {selectedShop.revenue}</span>
                </div>
                <div>
                  <span className="text-[#717171] block">No-Show Rate</span>
                  <span className="font-bold text-amber-600">{selectedShop.no_show_rate}%</span>
                </div>
                <div>
                  <span className="text-[#717171] block">Status</span>
                  <span className={`font-bold ${selectedShop.is_suspended ? "text-red-600" : "text-emerald-600"}`}>
                    {selectedShop.is_suspended ? "Suspended (Hidden)" : "Active (Live)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSuspend(selectedShop)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors ${
                    selectedShop.is_suspended
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {selectedShop.is_suspended ? "Reactivate Shop" : "Suspend Shop Access"}
                </button>

                <Link
                  href={`/book/${selectedShop.slug}`}
                  target="_blank"
                  className="py-2.5 px-4 rounded-xl border border-[#222222] font-semibold text-xs text-[#222222] hover:bg-[#f7f7f7] flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit Shop</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
