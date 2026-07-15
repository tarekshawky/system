import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import {
  EDITABLE_ROLES,
  LOCKED_PERMISSIONS,
  PERMISSION_KEYS,
  type Permission,
} from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateSettings, updateRolePermissions } from "@/lib/actions/settings";

const EDITABLE_PERMISSIONS = PERMISSION_KEYS.filter(
  (key) => !LOCKED_PERMISSIONS.includes(key),
);

export default async function SettingsPage() {
  await requirePermission("settings.manage");

  const [t, tNav, tCommon, tUsers, setting, rolePermissions] =
    await Promise.all([
      getTranslations("settingsPage"),
      getTranslations("nav"),
      getTranslations("common"),
      getTranslations("usersPage"),
      prisma.setting.findUnique({ where: { id: 1 } }),
      prisma.rolePermission.findMany(),
    ]);

  const allowedMap = new Map(
    rolePermissions.map((row) => [`${row.role}:${row.permission}`, row.allowed]),
  );

  const roleLabels: Record<string, string> = {
    MANAGER: tUsers("roleManager"),
    STAFF: tUsers("roleStaff"),
  };

  const permissionLabel = (permission: Permission) =>
    t(`permission_${permission.replaceAll(".", "_")}` as "permission");

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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("rolePermissions")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("rolePermissionsHint")}
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={updateRolePermissions}
            className="flex flex-col gap-4"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("permission")}</TableHead>
                  {EDITABLE_ROLES.map((role) => (
                    <TableHead key={role} className="text-center">
                      {roleLabels[role]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {EDITABLE_PERMISSIONS.map((permission) => (
                  <TableRow key={permission}>
                    <TableCell>{permissionLabel(permission)}</TableCell>
                    {EDITABLE_ROLES.map((role) => {
                      const fieldName = `perm__${role}__${permission}`;
                      return (
                        <TableCell key={role} className="text-center">
                          <Checkbox
                            name={fieldName}
                            defaultChecked={
                              allowedMap.get(`${role}:${permission}`) ?? false
                            }
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="submit" className="self-start">
              {tCommon("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
