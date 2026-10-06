"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GHANA_REGIONS, directionsUrl, getDeviceLocation } from "@/lib/location";
import type { Database } from "@/types/supabase";
type Listing = Database["public"]["Functions"]["discover_shops"]["Returns"][number];
const field = "min-h-11 px-3 py-2 rounded-xl border border-border bg-background text-sm w-full";

export function ShopDiscovery() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(25);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState({ query: "", region: "" });
  const [shops, setShops] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setShops([]);
      const params = new URLSearchParams({ q: search.query, region: search.region, radius: String(radius), offset: String(offset) });
      if (coords) { params.set("lat", String(coords.latitude)); params.set("lon", String(coords.longitude)); }
      try {
        const response = await fetch(`/api/shops?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Couldn’t load shops. Try again.");
        setShops(result.shops); setTotal(Number(result.total));
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Couldn’t load shops."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [search, coords, radius, offset, retry]);
  async function nearMe() {
    setLocating(true); setLocationMessage("");
    try { const position = await getDeviceLocation(); setCoords(position); setOffset(0); setRegion(""); setQuery(""); setSearch({ query: "", region: "" }); }
    catch (error) { setLocationMessage(error instanceof Error ? error.message : "Couldn’t get your location. Search by town instead."); }
    finally { setLocating(false); }
  }
  return <div id="shops" className="scroll-mt-24">
    <form className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 mb-3" onSubmit={event => { event.preventDefault(); setSearch({ query: query.trim(), region }); setOffset(0); }}>
      <div><label htmlFor="shop-search" className="block text-sm font-semibold mb-1">Town, area, or shop name</label>
        <input id="shop-search" className={field} maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Where would you like a cut?" /></div>
      <div><label htmlFor="shop-region" className="block text-sm font-semibold mb-1">Region</label>
        <select id="shop-region" value={region} onChange={event => setRegion(event.target.value)} className={field}>
          <option value="">All regions</option>{GHANA_REGIONS.map(region => <option key={region}>{region}</option>)}
        </select></div>
      <button className="min-h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:self-end">Search</button>
      <button type="button" disabled={locating} onClick={nearMe} className="min-h-11 px-5 rounded-xl border border-border font-semibold text-sm sm:self-end disabled:opacity-50">{locating ? "Locating…" : "Near me"}</button>
    </form>
    <p className="text-xs text-muted-foreground mb-6">Browse without location permission. “Near me” uses your location for this search only.</p>
    {locationMessage && <p role="alert" className="text-sm text-red-700 mb-4">{locationMessage}</p>}
    {coords && <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
      <label htmlFor="shop-radius">Within</label><select id="shop-radius" className="min-h-11 border border-border rounded-xl px-3 bg-background" value={radius} onChange={event => { setRadius(Number(event.target.value)); setOffset(0); }}>
        {[10, 25, 50, 100, 200].map(distance => <option key={distance} value={distance}>{distance} km</option>)}
      </select><button type="button" className="min-h-11 underline" onClick={() => { setCoords(null); setOffset(0); }}>Clear nearby filter</button>
      <p className="text-muted-foreground">Only shops with a map pin appear nearby.</p>
    </div>}
    <div aria-live="polite" aria-busy={loading}>
      {loading ? <p className="py-8 text-muted-foreground">Finding shops…</p> : error ? <div className="py-8"><p role="alert">{error}</p><button type="button" className="min-h-11 underline" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
        : !shops.length ? <div className="py-8"><h3 className="text-lg font-semibold">No shops found{coords ? " nearby" : ""}</h3><p className="text-muted-foreground mt-2">{coords ? "Try a wider distance or clear the nearby filter to search by town." : "Try another town, area, or region. New shops can register anywhere in Ghana."}</p></div>
        : <>
          <p className="text-sm text-muted-foreground mb-4">{total} {total === 1 ? "shop" : "shops"} found{coords ? " · closest first · straight-line distances" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{shops.map(shop => <article key={shop.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
            <h3 className="text-xl font-bold">{shop.name}</h3>
            <p className="text-sm text-muted-foreground">{[shop.city, shop.region].filter(Boolean).join(", ")}</p>
            {shop.tagline && <p className="text-sm text-muted-foreground">{shop.tagline}</p>}
            <p className="text-sm text-muted-foreground">{shop.address}</p>
            {shop.distance_km !== null && <p className="text-sm font-semibold">{shop.distance_km < 1 ? "Less than 1" : shop.distance_km.toFixed(1)} km away</p>}
            <div className="mt-auto pt-2 space-y-2"><Link href={`/book/${shop.slug}`} className="min-h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center">Book appointment</Link>
              <a href={directionsUrl(shop)} target="_blank" rel="noopener noreferrer" className="min-h-11 flex items-center justify-center text-sm underline">Get directions<span className="sr-only"> (opens in a new tab)</span></a></div>
          </article>)}</div>
        </>}
    </div>
    {!loading && !error && (offset > 0 || offset + shops.length < total) && <nav aria-label="Shop results pages" className="mt-6 flex items-center gap-4">
      <button type="button" disabled={offset === 0} className="min-h-11 px-4 border border-border rounded-xl disabled:opacity-50" onClick={() => setOffset(value => Math.max(0, value - 12))}>Previous</button>
      <span className="text-sm">Page {offset / 12 + 1}</span>
      <button type="button" disabled={offset + shops.length >= total} className="min-h-11 px-4 border border-border rounded-xl disabled:opacity-50" onClick={() => setOffset(value => value + 12)}>Next</button>
    </nav>}
  </div>;
}
