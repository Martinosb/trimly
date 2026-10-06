"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function PinMap({ latitude, longitude, onChange }: {
  latitude: number | null; longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const changeRef = useRef(onChange);
  const [tileError, setTileError] = useState(false);
  useEffect(() => { changeRef.current = onChange; }, [onChange]);
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { scrollWheelZoom: false }).setView([7.9, -1.2], 6);
    mapRef.current = map;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    map.on("click", (event: L.LeafletMouseEvent) => changeRef.current(event.latlng.lat, event.latlng.lng));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(element.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude === null || longitude === null) {
      markerRef.current?.remove(); markerRef.current = null; return;
    }
    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true, icon: L.divIcon({
        className: "shop-map-pin", html: '<span style="display:block;width:24px;height:24px;border-radius:50%;background:#ff385c;border:3px solid white;box-shadow:0 2px 6px #0005"></span>', iconSize: [24, 24], iconAnchor: [12, 12],
      }) }).addTo(map);
      markerRef.current.on("dragend", () => { const pin = markerRef.current!.getLatLng(); changeRef.current(pin.lat, pin.lng); });
    } else markerRef.current.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], Math.max(map.getZoom(), 15), { animate: false });
  }, [latitude, longitude]);
  return <div>
    <div ref={element} aria-label="Shop location map. Pan with arrow keys and use the button below to select the centre." className="h-64 w-full rounded-xl border border-border isolate" />
    <button type="button" className="mt-2 min-h-11 underline text-sm" onClick={() => {
      const centre = mapRef.current?.getCenter(); if (centre) onChange(centre.lat, centre.lng);
    }}>Place pin at map centre</button>
    {tileError && <p role="status" className="text-sm text-muted-foreground">Map tiles couldn’t load. You can still use current location or enter coordinates below.</p>}
  </div>;
}
