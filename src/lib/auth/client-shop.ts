import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export type Shop = Database["public"]["Tables"]["shops"]["Row"];

const CURRENT_SHOP_KEY = "gxstyl_current_shop_slug";

/** Resolve only shops owned by, or actively assigned to, the authenticated user. */
export async function getCurrentShop(
  supabase: SupabaseClient<Database>
): Promise<Shop | null> {
  try {
    // 1. Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1a. User is shop owner
      const { data: ownerShop } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ownerShop) {
        if (typeof window !== "undefined") {
          localStorage.setItem(CURRENT_SHOP_KEY, ownerShop.slug);
        }
        return ownerShop;
      }

      // 1b. User is staff member
      const { data: staffRecord } = await supabase
        .from("staff")
        .select("shop_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (staffRecord?.shop_id) {
        const { data: staffShop } = await supabase
          .from("shops")
          .select("*")
          .eq("id", staffRecord.shop_id)
          .maybeSingle();

        if (staffShop) {
          if (typeof window !== "undefined") {
            localStorage.setItem(CURRENT_SHOP_KEY, staffShop.slug);
          }
          return staffShop;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Error resolving current shop:", err);
    return null;
  }
}

export function setRememberedShopSlug(slug: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_SHOP_KEY, slug);
  }
}

export function getRememberedShopSlug(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(CURRENT_SHOP_KEY);
  }
  return null;
}
