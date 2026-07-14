import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  await requirePermission("settings.manage");

  const [t, tNav, tCommon, setting] = await Promise.all([
    getTranslations("settingsPage"),
    getTranslations("nav"),
    getTranslations("common"),
    prisma.setting.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{tNav("settings")}</h1>
      <Card className="max-w-lg">
        <CardContent>
          <form action={updateSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyName">{t("companyName")}</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={setting?.companyName ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyLogo">{t("companyLogo")}</Label>
              <Input
                id="companyLogo"
                name="companyLogo"
                defaultValue={setting?.companyLogo ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={setting?.address ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultLowStockThreshold">
                {t("defaultLowStockThreshold")}
              </Label>
              <Input
                id="defaultLowStockThreshold"
                name="defaultLowStockThreshold"
                type="number"
                step="0.001"
                min="0"
                defaultValue={
                  setting?.defaultLowStockThreshold?.toString() ?? "0"
                }
              />
            </div>
            <Button type="submit" className="self-start">
              {tCommon("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
