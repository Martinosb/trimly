import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getWorkspaceDestination,
  safeDestination,
} from "@/lib/auth/destination";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", url));
  const requested = safeDestination(url.searchParams.get("next"));
  const destination =
    requested && requested !== "/dashboard"
      ? requested
      : await getWorkspaceDestination(user.id);
  const response = NextResponse.redirect(new URL(destination, url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
