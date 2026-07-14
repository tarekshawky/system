import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Warehouse,
  Tags,
  Package,
  Truck,
  Users,
  ArrowLeftRight,
  FileBarChart,
  History,
  UserCog,
  Settings,
} from "lucide-react";
import type { Role } from "@/lib/generated/prisma/enums";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles?: Role[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/warehouses", labelKey: "warehouses", icon: Warehouse },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/suppliers", labelKey: "suppliers", icon: Truck },
  { href: "/customers", labelKey: "customers", icon: Users },
  { href: "/movements", labelKey: "movements", icon: ArrowLeftRight },
  { href: "/reports", labelKey: "reports", icon: FileBarChart },
  {
    href: "/audit-log",
    labelKey: "auditLog",
    icon: History,
    roles: ["ADMIN"],
  },
  { href: "/users", labelKey: "users", icon: UserCog, roles: ["ADMIN"] },
  {
    href: "/settings",
    labelKey: "settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];
