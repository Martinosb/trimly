import { requireStaff } from "@/lib/auth/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return children;
}
