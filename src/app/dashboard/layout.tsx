import React from "react";
import { requireOwner } from "@/lib/auth/guards";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  Users,
  Tag,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { LiveBookingLink } from "@/components/dashboard/live-booking-link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar (Airbnb style) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-card/95 backdrop-blur-sm border-r border-border p-5 shrink-0 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                GxStyl
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Shop Manager
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm bg-primary/10 text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Live Timeline</span>
            </Link>

            <Link
              href="/dashboard/services"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm hover:bg-background transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Tag className="w-4 h-4" />
              <span>Services & Prices</span>
            </Link>

            <Link
              href="/dashboard/staff"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm hover:bg-background transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Users className="w-4 h-4" />
              <span>Barbers & Chairs</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm hover:bg-background transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="w-4 h-4" />
              <span>Shop & Policies</span>
            </Link>

            <Link
              href="/staff"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm hover:bg-background transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Staff Mobile View</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-4 border-t border-border">
          <LiveBookingLink />

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
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation Bar (Stitch 12) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1 py-1 shadow-[0_-6px_24px_rgba(34,34,34,0.08)] min-h-[60px] pb-[max(4px,env(safe-area-inset-bottom))]">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center py-1 px-2.5 text-primary min-h-[44px] min-w-[44px]"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Timeline</span>
        </Link>

        <Link
          href="/dashboard/services"
          className="flex flex-col items-center justify-center py-1 px-2.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Services</span>
        </Link>

        <Link
          href="/dashboard/staff"
          className="flex flex-col items-center justify-center py-1 px-2.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Chairs</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex flex-col items-center justify-center py-1 px-2.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
