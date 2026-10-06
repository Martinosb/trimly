"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentShop, getRememberedShopSlug } from "@/lib/auth/client-shop";

export function LiveBookingLink() {
  const [slug, setSlug] = useState<string | null>(getRememberedShopSlug());

  useEffect(() => {
    const supabase = createClient();
    getCurrentShop(supabase).then((shop) => {
      if (shop?.slug) {
        setSlug(shop.slug);
      }
    });
  }, []);

  const href = slug ? `/book/${slug}` : "/dashboard/settings";

  return (
    <Link
      href={href}
      target={slug ? "_blank" : undefined}
      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#717171] hover:text-[#222222] hover:bg-[#f7f7f7] transition-colors"
    >
      <span>Live Booking Link</span>
      <ExternalLink className="w-3.5 h-3.5" />
    </Link>
  );
}
