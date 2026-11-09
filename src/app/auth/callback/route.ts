import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getWorkspaceDestination,
  safeDestination,
} from "@/lib/auth/destination";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = safeDestination(requestedNext);
  const errorParam =
    searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}`,
    );
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

          const destination = await getWorkspaceDestination(user.id);
          return NextResponse.redirect(`${origin}${destination}`);
        }
      } catch (err) {
        console.error("Error during post-auth routing:", err);
      }

      // Fallback to provided next or default to dashboard
      return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/login?error=Could+not+authenticate+user`,
  );
}
