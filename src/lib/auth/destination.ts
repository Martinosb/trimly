import { checkIsPlatformAdmin, getOwnerShop, getStaffProfile } from "./session";

/** Resolve workspace from trusted database roles, never an email or editable metadata. */
export async function getWorkspaceDestination(userId: string) {
  if (await checkIsPlatformAdmin(userId)) return "/admin";
  const [shop, staff] = await Promise.all([
    getOwnerShop(userId),
    getStaffProfile(userId),
  ]);
  if (shop) return "/dashboard";
  return staff ? "/staff" : "/onboard";
}

export function safeDestination(value: string | null) {
  return value && /^\/(?!\/)[a-zA-Z0-9/_?=&%-]*$/.test(value) ? value : null;
}
