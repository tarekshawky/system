"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import type { Role } from "@/lib/generated/prisma/enums";

export function SidebarNav({
  role,
  onNavigate,
}: {
  role?: Role;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems
        .filter((item) => !item.roles || (role && item.roles.includes(role)))
        .map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
    </nav>
  );
}
