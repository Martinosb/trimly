"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Phone, Mail, Clock, Check, Trash2, UserCheck, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  is_active: boolean;
  user_id: string | null;
}

export default function StaffManagementPage() {
  const supabase = createClient();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Senior Barber");
  const [phone, setPhone] = useState("+233 ");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("slug", "gentlemens-cut")
        .single();

      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase
          .from("staff")
          .select("*")
          .eq("shop_id", shop.id)
          .order("created_at", { ascending: true });

        if (data) setStaffList(data as StaffMember[]);
      }
      setLoading(false);
    }

    loadStaff();
  }, [supabase]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !name.trim()) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("staff")
      .insert({
        shop_id: shopId,
        name,
        role,
        phone: phone.trim() || null,
        email: email.trim() || null,
        bio: bio.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      // Also add default working hours (Mon to Sat 08:30 - 18:30)
      const hours = [];
      for (let d = 1; d <= 6; d++) {
        hours.push({
          staff_id: data.id,
          day_of_week: d,
          start_time: "08:30:00",
          end_time: "18:30:00",
          is_working: true,
        });
      }
      hours.push({
        staff_id: data.id,
        day_of_week: 0,
        start_time: "10:00:00",
        end_time: "16:00:00",
        is_working: false,
      });

      await supabase.from("staff_hours").insert(hours);

      // Map to all existing services
      const { data: allServices } = await supabase.from("services").select("id").eq("shop_id", shopId);
      if (allServices && allServices.length > 0) {
        await supabase.from("staff_services").insert(
          allServices.map((sv) => ({ staff_id: data.id, service_id: sv.id }))
        );
      }

      setStaffList([...staffList, data as StaffMember]);
      setShowAddForm(false);
      setName("");
      setBio("");
      setPhone("+233 ");
      setEmail("");
    } else if (error) {
      alert(error.message);
    }
    setSaving(false);
  };

  const handleToggleActive = async (member: StaffMember) => {
    const updated = !member.is_active;
    await supabase.from("staff").update({ is_active: updated }).eq("id", member.id);
    setStaffList(staffList.map((s) => (s.id === member.id ? { ...s, is_active: updated } : s)));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-6 border-b border-[#ebebeb]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#222222]">
            Barbers & Chair Stations
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Manage your barbers, individual calendars, and chair logins
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2.5 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Barber</span>
        </button>
      </div>

      {/* Add Barber Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddStaff}
          className="my-6 p-5 rounded-2xl bg-white border border-[#ebebeb] shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-[#222222]">New Team Member</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#222222] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kwame Mensah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">Role / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Barber & Stylist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+233 24 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">Email (for staff login)</label>
              <input
                type="email"
                placeholder="barber@gentlemenscut.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#222222] mb-1">Bio / Specialties</label>
              <input
                type="text"
                placeholder="Specialist in sharp tapers, razor art, and hot towel beard conditioning."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dddddd] focus:outline-none focus:border-[#ff385c]"
              />
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
              {saving ? "Saving..." : "Add Barber"}
            </button>
          </div>
        </form>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {staffList.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-2xl border border-[#ebebeb] bg-white shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#222222] text-white flex items-center justify-center font-bold text-base">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#222222]">{member.name}</h3>
                  <span className="text-xs text-[#ff385c] font-medium">{member.role}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  member.is_active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {member.is_active ? "Active" : "Off Duty"}
              </span>
            </div>

            {member.bio && (
              <p className="text-xs text-[#717171] leading-relaxed">{member.bio}</p>
            )}

            <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#717171]">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Mon-Sat: 8:30 AM - 6:30 PM</span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleActive(member)}
                className="px-2.5 py-1 rounded-lg border border-[#dddddd] font-medium hover:border-[#222222] transition-colors"
              >
                {member.is_active ? "Set Off Duty" : "Activate Chair"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
