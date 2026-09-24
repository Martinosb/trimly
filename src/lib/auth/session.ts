import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getOwnerShop(userId: string) {
  const supabase = createAdminClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  return shop;
}

export async function getStaffProfile(userId: string) {
  const supabase = createAdminClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("*, shops(*)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return staff;
}

export async function checkIsPlatformAdmin(userId: string, email?: string | null) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("id")
    .or(`user_id.eq.${userId},email.ilike.${email || "none"}`)
    .maybeSingle();

  return !!data;
}
