"use client";

import { useState, useId } from "react";
import dynamic from "next/dynamic";
import { GHANA_REGIONS, getDeviceLocation, hasCoordinates, type ShopLocation } from "@/lib/location";
const PinMap = dynamic(() => import("./pin-map"), { ssr: false, loading: () => <p role="status">Loading map…</p> });
const field = "w-full min-h-11 px-3 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary";

export function LocationFields({ value, onChange, confirmed, onConfirmedChange }: {
  value: ShopLocation; onChange: (value: ShopLocation) => void;
  confirmed: boolean; onConfirmedChange: (confirmed: boolean) => void;
}) {
  const id = useId();
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const update = (patch: Partial<ShopLocation>) => { onChange({ ...value, ...patch }); onConfirmedChange(false); };
  async function locate() {
    setLocating(true); setError("");
    try { update(await getDeviceLocation()); setShowMap(true); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t get location. Choose it manually."); }
    finally { setLocating(false); }
  }
  return <fieldset className="space-y-4 sm:col-span-2 min-w-0">
    <legend className="font-semibold mb-3">Shop location</legend>
    <div className="grid sm:grid-cols-2 gap-4">
      <div><label htmlFor={`${id}-region`} className="block text-sm font-semibold mb-1">Region *</label>
        <select id={`${id}-region`} required value={value.region} onChange={event => update({ region: event.target.value })} className={field}>
          <option value="">Select region</option>{GHANA_REGIONS.map(region => <option key={region}>{region}</option>)}
        </select></div>
      <div><label htmlFor={`${id}-town`} className="block text-sm font-semibold mb-1">City, town, or village *</label>
        <input id={`${id}-town`} required maxLength={120} autoComplete="address-level2" value={value.city} onChange={event => update({ city: event.target.value })} placeholder="e.g. Kpando, Berekum, or your village" className={field} />
        <p className="text-xs text-muted-foreground mt-1">Any locality in Ghana is welcome.</p></div>
    </div>
    <div><label htmlFor={`${id}-address`} className="block text-sm font-semibold mb-1">Area, street address, or landmark *</label>
      <input id={`${id}-address`} required maxLength={300} autoComplete="street-address" value={value.address} onChange={event => update({ address: event.target.value })} placeholder="e.g. Market Road, opposite the post office" className={field} /></div>
    <div className="space-y-3">
      <p className="text-sm font-semibold">Map pin <span className="font-normal text-muted-foreground">(optional)</span></p>
      <p className="text-sm text-muted-foreground">Use current location only if you’re at your shop. Adjust the pin to the entrance so customers can get directions.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={locating} onClick={locate} className="min-h-11 px-4 rounded-xl border border-border text-sm font-semibold disabled:opacity-50">{locating ? "Getting location…" : "Use my current location"}</button>
        <button type="button" onClick={() => setShowMap(!showMap)} className="min-h-11 px-4 rounded-xl border border-border text-sm font-semibold">{showMap ? "Hide map" : "Choose on map"}</button>
        {hasCoordinates(value) && <button type="button" onClick={() => update({ latitude: null, longitude: null })} className="min-h-11 px-3 text-sm underline">Remove pin</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {showMap && <PinMap latitude={value.latitude} longitude={value.longitude} onChange={(latitude, longitude) => update({ latitude, longitude })} />}
      <details><summary className="cursor-pointer text-sm py-2">Enter coordinates manually</summary>
        <label htmlFor={`${id}-coordinates`} className="block text-sm mb-1">Latitude, longitude</label>
        <div className="flex gap-2"><input id={`${id}-coordinates`} className={field} value={manual} onChange={event => setManual(event.target.value)} placeholder="e.g. 5.6037, -0.1870" />
          <button type="button" className="min-h-11 px-3 border border-border rounded-xl" onClick={() => {
            const parts = manual.split(","); const latitude = Number(parts[0]); const longitude = Number(parts[1]);
            if (parts.length !== 2 || parts.some(part => !part.trim()) || !hasCoordinates({ latitude, longitude })) { setError("Enter valid latitude and longitude separated by a comma."); return; }
            setError(""); update({ latitude, longitude }); setShowMap(true);
          }}>Set pin</button></div>
      </details>
      {hasCoordinates(value) && <p className="text-sm text-muted-foreground">Pin: {value.latitude!.toFixed(5)}, {value.longitude!.toFixed(5)}</p>}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={confirmed} onChange={event => onConfirmedChange(event.target.checked)} />
        <span>I confirm these location details{hasCoordinates(value) ? " and the map pin" : ""} are for my shop.</span></label>
      <p className="text-xs text-muted-foreground">Your shop location will appear publicly. You can add or change the pin later in settings.</p>
    </div>
  </fieldset>;
}
