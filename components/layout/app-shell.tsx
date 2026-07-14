import { getTranslations } from "next-intl/server";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import type { Role } from "@/lib/generated/prisma/enums";

export async function AppShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName?: string;
  role?: Role;
}) {
  const t = await getTranslations("app");

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 border-e bg-sidebar md:block">
        <div className="flex h-14 items-center px-4 font-semibold text-sidebar-foreground">
          {t("name")}
        </div>
        <SidebarNav role={role} />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar appName={t("name")} userName={userName} role={role} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
