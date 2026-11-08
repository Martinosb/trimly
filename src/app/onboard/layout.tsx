import { requireUser } from "@/lib/auth/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
