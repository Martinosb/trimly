import React from "react";
import Link from "next/link";
import {
  Scissors,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";
import { ShopDiscovery } from "@/components/location/shop-discovery";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-full focus:shadow-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 sm:py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            aria-label="GxStyl Home"
            className="flex items-center gap-2 group shrink-0 rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xs transition-transform motion-reduce:transform-none group-hover:scale-105">
              <Scissors aria-hidden="true" className="w-4 h-4 fill-current rotate-45" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground">
              GxStyl
            </span>
          </Link>

          {/* Right Action Buttons */}
          <nav aria-label="Main Navigation" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="min-h-[44px] inline-flex items-center justify-center text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-full hover:bg-muted text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Shop Login
            </Link>
            <Link
              href="/onboard"
              className="min-h-[44px] inline-flex items-center justify-center text-sm font-semibold px-4 sm:px-5 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-all shadow-xs whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              List Shop
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 pt-10 sm:pt-20 pb-12 sm:pb-24 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.14]">
            The new way to get a{" "}
            <span className="text-primary underline decoration-wavy decoration-primary/30">
              beautiful cut
            </span>
            .
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
            Find barbers and grooming shops across Ghana. Live open chairs, zero waiting in line, and instant MoMo deposits.
          </p>

          {/* Quick Search & Explore CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="#shops"
              className="w-full sm:w-auto min-h-[48px] px-7 sm:px-8 py-3.5 rounded-full bg-primary hover:bg-rausch-active active:scale-[0.98] motion-reduce:transform-none text-primary-foreground font-bold text-sm sm:text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>Find a shop</span>
              <ChevronRight aria-hidden="true" className="w-5 h-5 stroke-[2.5]" />
            </Link>

            <Link
              href="/onboard"
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-7 py-3.5 rounded-full border border-border hover:border-foreground text-foreground font-semibold text-sm sm:text-base transition-colors flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              I&apos;m a Barber / Shop Owner
            </Link>
          </div>
        </section>

        {/* Featured Shops Grid */}
        <section aria-labelledby="featured-shops-heading" className="px-4 sm:px-8 py-12 sm:py-16 bg-muted/40 border-t border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
              <div>
                <h2 id="featured-shops-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Find your next grooming spot
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Search cities, towns, and villages across Ghana.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Live Real-Time Chairs</span>
              </div>
            </div>

            <ShopDiscovery />
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section aria-labelledby="features-heading" className="px-4 sm:px-8 py-16 sm:py-20 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Designed for Modern Ghanaian Grooming
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Say goodbye to crowded waiting benches and awkward phone calls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck aria-hidden="true" className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Live Concurrency Locking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our Postgres exclusion engine guarantees that when you select a time slot, no one else can book over your chair.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone aria-hidden="true" className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">MTN & Telecel MoMo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pay deposits or full amounts directly via Mobile Money or choose to pay cash at the salon chair upon arrival.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck aria-hidden="true" className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Instant Digital Pass</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive a boarding pass with a QR code and reference number. Easily reschedule or cancel with 1-click self-service.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-8 bg-muted/30 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <Scissors aria-hidden="true" className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">GxStyl</span>
            <span>— The new way to get a beautiful cut.</span>
          </div>

          <nav aria-label="Footer Navigation" className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center md:justify-end">
            <Link
              href="/login"
              className="min-h-[44px] min-w-[44px] inline-flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Shop Login
            </Link>
            <Link
              href="/onboard"
              className="min-h-[44px] min-w-[44px] inline-flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Onboarding
            </Link>
            <Link
              href="/admin"
              className="min-h-[44px] min-w-[44px] inline-flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Platform Admin
            </Link>
            <Link
              href="/privacy"
              className="min-h-[44px] min-w-[44px] inline-flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="min-h-[44px] min-w-[44px] inline-flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
