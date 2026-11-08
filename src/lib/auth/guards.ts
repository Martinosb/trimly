import { redirect } from "next/navigation";
import { getCurrentUser, getOwnerShop, getStaffProfile, checkIsPlatformAdmin } from "./session";

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  const shop = await getOwnerShop(user.id);
  if (!shop) redirect("/onboard");
  return shop;
}

export async function requireStaff() {
  const user = await requireUser("/staff");
  const [shop, staff] = await Promise.all([getOwnerShop(user.id), getStaffProfile(user.id)]);
  if (!shop && !staff) redirect("/onboard");
  return { user, shop, staff };
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!(await checkIsPlatformAdmin(user.id))) redirect("/dashboard");
  return user;
}
