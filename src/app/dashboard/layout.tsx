import React from "react";
import { DashboardNavigation } from "@/components/dashboard/navigation";
import { requireOwner } from "@/lib/auth/guards";
import Link from "next/link";
import { Scissors, LogOut } from "lucide-react";
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
          <Link
            href="/"
            className="flex items-center gap-2 group rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Trimly
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Shop Manager
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <DashboardNavigation />
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
      <DashboardNavigation mobile />
    </div>
  );
}
