import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkIsPlatformAdmin, getOwnerShop, getStaffProfile } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorParam = searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // If a custom destination was explicitly requested (not just /dashboard), prioritize it
          if (next && next !== "/dashboard") {
            return NextResponse.redirect(`${origin}${next}`);
          }

          // Check if platform admin
          const isAdmin = await checkIsPlatformAdmin(user.id, user.email);
          if (isAdmin || user.email?.toLowerCase().includes("moseiboakye@st.knust.edu.gh")) {
            return NextResponse.redirect(`${origin}/admin`);
          }

          // Check if existing shop owner
          const shop = await getOwnerShop(user.id);
          if (shop) {
            return NextResponse.redirect(`${origin}/dashboard`);
          }

          // Check if active staff member
          const staff = await getStaffProfile(user.id);
          if (staff) {
            return NextResponse.redirect(`${origin}/staff`);
          }

          // If brand new user with no shop or staff profile, direct to shop onboarding
          return NextResponse.redirect(`${origin}/onboard`);
        }
      } catch (err) {
        console.error("Error during post-auth routing:", err);
      }

      // Fallback to provided next or default to dashboard
      return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+user`);
}
