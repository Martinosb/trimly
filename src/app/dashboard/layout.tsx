import React from "react";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  Users,
  Tag,
  Settings,
  PlusCircle,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#222222] font-sans flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (Airbnb style) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-[#ebebeb] p-5 shrink-0 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-xs">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#222222]">
                Trimly
              </span>
              <span className="text-[10px] text-[#717171] uppercase tracking-wider block font-semibold">
                Shop Manager
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f7f7f7] transition-colors text-[#222222]"
            >
              <Calendar className="w-4 h-4 text-[#ff385c]" />
              <span>Live Timeline</span>
            </Link>

            <Link
              href="/dashboard/services"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f7f7f7] transition-colors text-[#717171] hover:text-[#222222]"
            >
              <Tag className="w-4 h-4" />
              <span>Services & Prices</span>
            </Link>

            <Link
              href="/dashboard/staff"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f7f7f7] transition-colors text-[#717171] hover:text-[#222222]"
            >
              <Users className="w-4 h-4" />
              <span>Barbers & Chairs</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f7f7f7] transition-colors text-[#717171] hover:text-[#222222]"
            >
              <Settings className="w-4 h-4" />
              <span>Shop & Policies</span>
            </Link>

            <Link
              href="/staff"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f7f7f7] transition-colors text-[#717171] hover:text-[#222222]"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Staff Mobile View</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-4 border-t border-[#f0f0f0]">
          <Link
            href="/book/gentlemens-cut"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#717171] hover:text-[#222222] hover:bg-[#f7f7f7] transition-colors"
          >
            <span>Live Booking Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation Bar (Stitch 12) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#ebebeb] flex items-center justify-around px-2 py-1.5 shadow-lg">
        <Link
          href="/dashboard"
          className="flex flex-col items-center py-1 px-3 text-[#ff385c]"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Timeline</span>
        </Link>

        <Link
          href="/dashboard/services"
          className="flex flex-col items-center py-1 px-3 text-[#717171] hover:text-[#222222]"
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Services</span>
        </Link>

        <Link
          href="/dashboard/staff"
          className="flex flex-col items-center py-1 px-3 text-[#717171] hover:text-[#222222]"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Chairs</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex flex-col items-center py-1 px-3 text-[#717171] hover:text-[#222222]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
