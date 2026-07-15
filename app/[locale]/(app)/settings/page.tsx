import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import {
  DEFAULT_PERMISSIONS,
  EDITABLE_ROLES,
  LOCKED_PERMISSIONS,
  PERMISSION_KEYS,
  type Permission,
} from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettings } from "@/lib/actions/settings";
import { SettingsForm } from "./settings-form";
import { RolePermissionsForm } from "./role-permissions-form";

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

  const initialAllowed: Record<string, boolean> = {};
  for (const row of rolePermissions) {
    initialAllowed[`${row.role}:${row.permission}`] = row.allowed;
  }
  // Any permission without a saved row yet still has its default effective
  // value — reflect that in the initial checkbox state instead of showing
  // everything as off.
  for (const role of EDITABLE_ROLES) {
    for (const permission of EDITABLE_PERMISSIONS) {
      const key = `${role}:${permission}`;
      if (!(key in initialAllowed)) {
        initialAllowed[key] = DEFAULT_PERMISSIONS[permission].includes(role);
      }
    }
  }

  const roleLabels: Record<string, string> = {
    MANAGER: tUsers("roleManager"),
    STAFF: tUsers("roleStaff"),
  };

  const permissionLabels: Record<Permission, string> = {} as Record<
    Permission,
    string
  >;
  for (const permission of EDITABLE_PERMISSIONS) {
    permissionLabels[permission] = t(
      `permission_${permission.replaceAll(".", "_")}` as "permission",
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{tNav("settings")}</h1>
      <Card className="max-w-lg">
        <CardContent>
          <SettingsForm
            action={updateSettings}
            setting={{
              companyName: setting?.companyName ?? "",
              companyLogo: setting?.companyLogo ?? null,
              address: setting?.address ?? null,
              defaultLowStockThreshold:
                setting?.defaultLowStockThreshold?.toString() ?? "0",
            }}
            labels={{
              companyName: t("companyName"),
              companyLogo: t("companyLogo"),
              address: t("address"),
              defaultLowStockThreshold: t("defaultLowStockThreshold"),
              save: tCommon("save"),
              saved: t("saved"),
              saveFailed: tCommon("saveFailed"),
            }}
          />
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
          <RolePermissionsForm
            roles={EDITABLE_ROLES}
            permissions={EDITABLE_PERMISSIONS}
            roleLabels={roleLabels}
            permissionLabels={permissionLabels}
            initialAllowed={initialAllowed}
            labels={{
              permission: t("permission"),
              save: tCommon("save"),
              saved: t("saved"),
              saveFailed: tCommon("saveFailed"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
