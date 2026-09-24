import React from "react";
import Link from "next/link";
import {
  Scissors,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Sparkles,
  Users,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const supabase = createAdminClient();

  // Fetch active shops from database
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, tagline, address, city, phone, is_suspended")
    .eq("is_suspended", false)
    .limit(6);

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#ffd1da] selection:text-[#ba0036]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#ebebeb] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Scissors className="w-5 h-5 fill-current rotate-45" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#222222]">
              Trimly
            </span>
          </Link>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-full hover:bg-[#f7f7f7] text-[#222222] transition-colors"
            >
              Shop Login
            </Link>
            <Link
              href="/onboard"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-[#222222] text-white hover:bg-black transition-all shadow-sm"
            >
              List Your Shop
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-10 sm:pt-16 pb-12 sm:pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff385c]/10 text-[#ff385c] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Accra • Kumasi • Tema</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#222222] leading-[1.1] sm:leading-[1.15]">
          The new way to get a{" "}
          <span className="text-[#ff385c] underline decoration-wavy decoration-[#ff385c]/30">
            beautiful cut
          </span>
          .
        </h1>

        <p className="mt-5 text-base sm:text-xl text-[#717171] max-w-2xl mx-auto font-normal leading-relaxed">
          Book top-tier barbers and grooming lounges in Ghana. Live open chairs, zero waiting in line, and instant MoMo deposits.
        </p>

        {/* Quick Search & Explore CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/book/gentlemens-cut"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ff385c] hover:bg-[#e00b41] active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-[#ff385c]/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Book at Gentlemen&apos;s Cut</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <Link
            href="/onboard"
            className="w-full sm:w-auto px-6 py-4 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] font-semibold text-base transition-colors"
          >
            I&apos;m a Barber / Shop Owner
          </Link>
        </div>
      </section>

      {/* Featured Shops Grid */}
      <section className="px-4 sm:px-8 py-10 bg-[#fafafa] border-t border-b border-[#ebebeb]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[#ff385c] uppercase tracking-wider block">
                Top Rated Barber Lounges
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#222222] mt-1">
                Popular Grooming Spots
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#717171] hidden sm:block">
              Live Real-Time Chairs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(shops && shops.length > 0 ? shops : []).map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Shop Cover Banner */}
                <div className="h-36 bg-gradient-to-tr from-[#222222] to-[#444444] p-4 flex flex-col justify-between relative">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 backdrop-blur px-2.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3 text-[#ff385c]" /> {shop.city}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current text-amber-400" /> 4.9
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-white tracking-tight group-hover:text-[#ff385c] transition-colors">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      {shop.tagline || shop.address}
                    </p>
                  </div>
                </div>

                {/* Shop Card Info */}
                <div className="p-4 space-y-3">
                  <div className="text-xs text-[#717171] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ff385c]" />
                    <span>Mon - Sat: 8:30 AM - 7:30 PM</span>
                  </div>

                  <Link
                    href={`/book/${shop.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Book Appointment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
            Designed for Modern Ghanaian Grooming
          </h2>
          <p className="text-sm text-[#717171] mt-2 max-w-xl mx-auto">
            Say goodbye to crowded waiting benches and awkward phone calls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-[#ebebeb] bg-[#fafafa] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#ff385c]/10 text-[#ff385c] flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#222222]">Live Concurrency Locking</h3>
            <p className="text-xs text-[#717171] leading-relaxed">
              Our Postgres exclusion engine guarantees that when you select a time slot, no one else can book over your chair.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#ebebeb] bg-[#fafafa] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#222222]">MTN & Telecel MoMo</h3>
            <p className="text-xs text-[#717171] leading-relaxed">
              Pay deposits or full amounts directly via Mobile Money or choose to pay cash at the salon chair upon arrival.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#ebebeb] bg-[#fafafa] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#222222]">Instant Digital Pass</h3>
            <p className="text-xs text-[#717171] leading-relaxed">
              Receive a boarding pass with a QR code and reference number. Easily reschedule or cancel with 1-click self-service.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ebebeb] py-10 px-4 sm:px-8 bg-[#fafafa] text-xs text-[#717171]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#ff385c]" />
            <span className="font-bold text-[#222222]">Trimly</span>
            <span>— The new way to get a beautiful cut.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[#222222]">
              Shop Login
            </Link>
            <Link href="/onboard" className="hover:text-[#222222]">
              Onboarding
            </Link>
            <Link href="/admin" className="hover:text-[#222222]">
              Platform Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
