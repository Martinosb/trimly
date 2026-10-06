import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { GHANA_REGIONS, hasCoordinates } from "@/lib/location";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") || "").trim();
  const region = params.get("region") || "";
  const latitude = params.has("lat") ? Number(params.get("lat")) : null;
  const longitude = params.has("lon") ? Number(params.get("lon")) : null;
  const radius = Number(params.get("radius") || 25);
  const offset = Number(params.get("offset") || 0);
  if (query.length > 120 || (region && !GHANA_REGIONS.some(value => value === region))
    || ((latitude !== null || longitude !== null) && !hasCoordinates({ latitude, longitude }))
    || ![10, 25, 50, 100, 200].includes(radius) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    return NextResponse.json({ error: "Choose a valid search location and radius." }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Shop search is unavailable. Please try again later." }, { status: 503 });
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("discover_shops", {
    search_text: query, search_region: region, radius_km: radius, page_offset: offset,
    ...(latitude !== null && longitude !== null ? { user_lat: latitude, user_lon: longitude } : {}),
  });
  if (error) {
    console.error("Shop discovery failed:", error.code);
    return NextResponse.json({ error: "Shop search is unavailable. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ shops: data || [], total: data?.[0]?.total_count || 0 }, { headers: { "Cache-Control": "no-store" } });
}
