"use client";

import { startTransition, useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEMO_ACCOUNTS = [
  { email: "admin@example.com", roleKey: "roleAdmin" },
  { email: "manager@example.com", roleKey: "roleManager" },
  { email: "staff@example.com", roleKey: "roleStaff" },
] as const;

export function LoginForm() {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");
  const tUsers = useTranslations("usersPage");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  function quickLogin(email: string) {
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", "password123");
    formData.set("locale", locale);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Card className="w-full max-w-sm">
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

        <div className="mt-6 flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">{t("testAccounts")}</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => quickLogin(account.email)}
              >
                {tUsers(account.roleKey)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
