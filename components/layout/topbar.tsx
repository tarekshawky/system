"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LocaleSwitcher } from "./locale-switcher";
import { SidebarNav } from "./sidebar-nav";
import type { Role } from "@/lib/generated/prisma/enums";

export function Topbar({
  appName,
  userName,
  role,
  onLogout,
}: {
  appName: string;
  userName?: string;
  role?: Role;
  onLogout?: () => void;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const initials = userName?.trim().slice(0, 1).toUpperCase() ?? "?";
  const sheetSide = locale === "ar" ? "right" : "left";

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={sheetSide} className="w-64 p-0">
          <SheetTitle className="sr-only">{appName}</SheetTitle>
          <div className="flex h-14 items-center px-4 font-semibold">
            {appName}
          </div>
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </SheetContent>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </Button>
      </Sheet>

      <span className="font-semibold md:hidden">{appName}</span>

      <div className="ms-auto flex items-center gap-2">
        <LocaleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="gap-2 px-2" />}
          >
            <Avatar className="size-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex items-center gap-2">
              <User className="size-4" />
              {userName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="size-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
