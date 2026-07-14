import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { auth } from "@/auth";
import { Role } from "@/lib/generated/prisma/enums";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login"];

const ADMIN_ONLY_PREFIXES = ["/users", "/audit-log", "/settings"];

function stripLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(first)) {
    return "/" + rest.join("/");
  }
  return pathname;
}

function localeOf(pathname: string) {
  const first = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(first)
    ? first
    : routing.defaultLocale;
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const locale = localeOf(pathname);
  const path = stripLocale(pathname) || "/";
  const isPublicPath = PUBLIC_PATHS.includes(path);
  const isAuthenticated = !!req.auth?.user;

  if (isPublicPath) {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, req.url),
      );
    }
    return intlMiddleware(req);
  }

  if (!isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (isAdminOnly && req.auth?.user.role !== Role.ADMIN) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
