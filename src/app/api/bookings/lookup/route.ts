import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = z.object({ code: z.string().trim().min(6).max(128), slug: z.string().min(1).max(100) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid booking reference." }, { status: 400 });
  const { data } = await createAdminClient().from("bookings")
    .select("id, client_name, client_phone, start_at, end_at, status, payment_status, price, deposit_amount, cancellation_code, staff(name, role, phone), services(name, duration_min), shops!inner(name, slug, phone, address, city, cancellation_hours)")
    .eq("cancellation_code", parsed.data.code.toUpperCase()).eq("shops.slug", parsed.data.slug).maybeSingle();
  if (!data) return NextResponse.json({ error: "No booking found. Check your reference and try again." }, { status: 404 });
  return NextResponse.json({ booking: data }, { headers: { "Cache-Control": "private, no-store" } });
}
