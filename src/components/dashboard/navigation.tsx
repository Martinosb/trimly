"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Tag, Users, Settings, Smartphone } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services & prices", icon: Tag },
  { href: "/dashboard/staff", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Shop settings", icon: Settings },
  { href: "/staff", label: "Staff view", icon: Smartphone },
];

// Adapted from HyperUI application side menus (MIT).
export function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobile shop navigation" : "Shop navigation"}
      className={
        mobile
          ? "lg:hidden fixed bottom-0 inset-x-0 z-30 flex justify-around border-t border-border bg-card px-1 py-2 pb-[max(8px,env(safe-area-inset-bottom))]"
          : "space-y-1"
      }
    >
      {items
        .filter((item) => !mobile || item.href !== "/staff")
        .map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${mobile ? "flex-col gap-1 px-2 text-[10px]" : "gap-3 px-3 py-3 text-sm"} flex items-center justify-start min-h-11 rounded-md font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
