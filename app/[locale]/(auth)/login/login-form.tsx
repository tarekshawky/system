"use client";

import { useRef, useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEMO_ACCOUNTS = [
  { roleKey: "roleAdmin", email: "admin@example.com" },
  { roleKey: "roleManager", email: "manager@example.com" },
  { roleKey: "roleStaff", email: "staff@example.com" },
] as const;
const DEMO_PASSWORD = "password123";

export function LoginForm() {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");
  const tUsers = useTranslations("usersPage");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemoAccount(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{tApp("name")}</CardTitle>
          <CardDescription>{t("loginTitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{t("invalidCredentials")}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={pending} className="mt-2">
              {t("login")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="font-medium">{t("testAccounts")}</p>
          {DEMO_ACCOUNTS.map((account) => (
            <p key={account.email} className="text-muted-foreground">
              {tUsers(account.roleKey)}:{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => fillDemoAccount(account.email)}
              >
                {account.email}
              </button>{" "}
              / {DEMO_PASSWORD}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
