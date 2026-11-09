import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Scissors,
  Check,
  Clock3,
} from "lucide-react";
import { ShopDiscovery } from "@/components/location/shop-discovery";

// Layout adapted from HyperUI marketing banners/2, headers and footers (MIT).
export default function HomePage() {
  return (
    <main>
      <a
        href="#shops"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-background p-4"
      >
        Skip to shop search
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark">
          <Scissors size={25} />
          trimly<span>®</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-8 text-sm"
        >
          <a href="#shops">Find a shop</a>
          <a href="#how-it-works">How it works</a>
          <a href="#business">For businesses</a>
        </nav>
        <Link href="/login" className="outline-action">
          Sign in <ArrowRight size={16} />
        </Link>
      </header>
      <section className="editorial-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="kicker">A LITTLE TIME FOR YOURSELF</p>
          <h1 id="hero-title">
            Good grooming.
            <br />
            On <em>your</em> time.
          </h1>
          <p className="hero-summary">
            Your next barber or salon appointment, without the back and forth.
            Find a shop in Ghana and book a time that works for you.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <a href="#shops" className="solid-action">
              Find your next appointment <ArrowRight size={18} />
            </a>
            <Link href="/login?mode=signup" className="text-action">
              List your business <ArrowRight size={16} />
            </Link>
          </div>
          <p className="hero-note">
            <Check size={15} /> Browse and book without an account
          </p>
          <div className="hero-index">
            <span>01 / A FRESH START</span>
            <span>BARBERS · SALONS · GHANA</span>
          </div>
        </div>
        <figure className="hero-photo">
          <Image
            src="/images/barbershop.jpg"
            alt="A barber carefully trimming a customer’s beard"
            fill
            preload
            sizes="(max-width: 800px) 100vw, 50vw"
            className="object-cover"
          />
          <figcaption>Find your chair. Make it your time.</figcaption>
        </figure>
      </section>
      <section
        id="shops"
        className="search-section"
        aria-labelledby="search-title"
      >
        <div className="section-heading">
          <div>
            <p className="kicker">YOUR NEXT APPOINTMENT</p>
            <h2 id="search-title">Find a place that feels like you.</h2>
          </div>
          <p>
            Search your town, explore your region,
            <br className="hidden sm:block" /> or see what’s nearby.
          </p>
        </div>
        <ShopDiscovery />
      </section>
      <section id="how-it-works" className="steps-section">
        <div className="section-heading">
          <div>
            <p className="kicker">LESS PLANNING. MORE LIVING.</p>
            <h2>From finding a shop to taking a seat.</h2>
          </div>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: MapPin,
              title: "Find your spot",
              text: "Search by town, region, or shop name. Use Near me when you want something closer.",
            },
            {
              icon: CalendarDays,
              title: "Choose your time",
              text: "Pick a service, see the price, and choose from the shop’s available appointments.",
            },
            {
              icon: Scissors,
              title: "Come as you are",
              text: "Keep your booking pass handy and head to the shop. Your next look is waiting.",
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <article className="instruction" key={title}>
              <div className="flex justify-between items-center">
                <Icon size={24} strokeWidth={1.5} />
                <span>0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="business" className="owner-section">
        <div>
          <p className="kicker">FOR THE PEOPLE BEHIND THE CHAIR</p>
          <h2>
            You know your craft.
            <br />
            <em>We’ll help with the calendar.</em>
          </h2>
          <p>
            One place for your appointments, services, and team. Give customers
            a booking link and spend more time doing what you do best.
          </p>
          <Link href="/login?mode=signup" className="solid-action">
            Bring your shop to Trimly <ArrowRight size={18} />
          </Link>
        </div>
        <div className="owner-benefits">
          {[
            {
              icon: CalendarDays,
              title: "A clearer view of your day",
              text: "Keep upcoming appointments together.",
            },
            {
              icon: Clock3,
              title: "Your services. Your schedule.",
              text: "Set prices, working hours, and staff availability.",
            },
            {
              icon: ArrowRight,
              title: "A link worth sharing",
              text: "Let customers book from WhatsApp or Instagram.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={22} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <Link href="/" className="wordmark">
          <Scissors size={23} />
          trimly<span>®</span>
        </Link>
        <p>A better way to make time.</p>
        <nav aria-label="Footer navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login?mode=signup">For businesses</Link>
        </nav>
        <span>© {new Date().getFullYear()} Trimly</span>
      </footer>
    </main>
  );
}
