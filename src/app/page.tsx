import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, Check, Clock3, MapPin, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { ShopDiscovery } from "@/components/location/shop-discovery";

export default function HomePage() {
  return (
    <main className="landing">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-background p-4 rounded-xl">Skip to content</a>
      <section className="hero" aria-labelledby="hero-title">
        <picture className="hero-picture">
          <source media="(max-width: 640px)" srcSet="/images/hero-mobile.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-desktop.webp" alt="A welcoming Ghanaian barber and his customer sharing a relaxed moment in a warmly lit shop" fetchPriority="high" width="1536" height="1024" />
        </picture>
        <div className="hero-shade" />
        <header className="landing-header">
          <Link href="/" className="brand" aria-label="GxStyl home"><span className="brand-icon"><Scissors size={21} strokeWidth={1.7} /></span>GxStyl<span className="brand-dot">.</span></Link>
          <nav aria-label="Main navigation" className="desktop-navigation"><a href="#shops">Find a shop</a><a href="#how-it-works">How it works</a><a href="#for-business">For businesses</a></nav>
          <Link href="/login" className="header-login">Sign in <ArrowRight size={16} /></Link>
        </header>
        <div className="hero-content" id="main-content">
          <p className="eyebrow"><span /> GOOD GROOMING. YOUR TIME.</p>
          <h1 id="hero-title">Your next look.<br /><em>Without the wait.</em></h1>
          <p className="hero-description">Find a barber or salon in Ghana. Choose your service, book an available time, and make room for the rest of your day.</p>
          <div className="hero-actions"><a href="#shops" className="landing-button">Find an appointment <ArrowRight size={19} /></a><a href="#how-it-works" className="hero-secondary">See how it works <ArrowDown size={16} /></a></div>
          <div className="hero-assurances"><span><Check size={15} /> No account needed to book</span><span><Check size={15} /> Your time, reserved</span></div>
        </div>
        <div className="hero-bottom"><span>LOOK GOOD. FEEL LIKE YOURSELF.</span><a href="#shops" aria-label="Scroll to find a shop"><ArrowDown size={18} /></a><span>MADE FOR GHANA <span aria-label="Ghana">🇬🇭</span></span></div>
      </section>

      <section className="how-section landing-section" id="how-it-works">
        <div className="section-intro"><p className="eyebrow">LESS WAITING. MORE LIVING.</p><h2>A little planning.<br /><span>A better kind of day.</span></h2><p>Your next haircut or salon visit, sorted in a few simple steps.</p></div>
        <div className="steps-grid">{[
          { number: "01", icon: MapPin, title: "Find your place", copy: "Explore shops by town, region, or what’s near you. Find a place that fits your day." },
          { number: "02", icon: CalendarDays, title: "Make time for you", copy: "Choose a service and a time that’s available. See the price before you book." },
          { number: "03", icon: Scissors, title: "Show up. Feel good.", copy: "Keep your booking pass handy, head to the shop, and let your barber or stylist take it from there." },
        ].map(({number,icon: Icon,title,copy}) => <article className="step-card" key={number}><div className="step-top"><Icon size={25} strokeWidth={1.4} /><span>{number}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="discovery-section landing-section" aria-labelledby="discover-title">
        <div className="discovery-heading"><div><p className="eyebrow">YOUR NEIGHBOURHOOD. YOUR NEXT LOOK.</p><h2 id="discover-title">Find your kind of <em>good.</em></h2></div><p>From your regular spot to a new favourite.<br />Your next appointment starts here.</p></div>
        <ShopDiscovery />
      </section>

      <section className="business-section landing-section" id="for-business">
        <div className="business-panel"><div className="business-copy"><p className="eyebrow"><Sparkles size={15} /> FOR BARBERS & SALON OWNERS</p><h2>You bring the craft.<br /><em>We’ll help with the diary.</em></h2><p>Give customers a simple way to book you. Manage appointments, services, and your team in one place—so you can focus on the person in your chair.</p><Link href="/login?mode=signup" className="landing-button">List your business <ArrowRight size={18} /></Link><span className="business-note">Set up your shop. Share your booking link. Welcome your next customer.</span></div><div className="business-details"><div><CalendarDays /><h3>Your appointments, together.</h3><p>See what’s coming up and keep your day organised.</p></div><div><Clock3 /><h3>Time that works for your team.</h3><p>Set your services, prices, working hours, and availability.</p></div><div><ShieldCheck /><h3>A booking link that’s yours.</h3><p>Share it on WhatsApp or Instagram so customers know where to book.</p></div></div></div>
      </section>
      <section className="closing-section"><p className="eyebrow">A FRESH LOOK. A LITTLE MORE YOU.</p><h2>Make time to <em>feel good.</em></h2><a href="#shops" className="landing-button">Explore shops <ArrowRight size={18} /></a></section>
      <footer className="landing-footer"><Link href="/" className="brand"><Scissors size={22} /> GxStyl<span className="brand-dot">.</span></Link><p>Good grooming. Less waiting.</p><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login?mode=signup">For businesses</Link></nav><span>© {new Date().getFullYear()} GxStyl</span></footer>
    </main>
  );
}
