"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";
import {
  EDITABLE_ROLES,
  LOCKED_PERMISSIONS,
  PERMISSION_KEYS,
} from "@/lib/auth/permissions";

export async function updateSettings(formData: FormData) {
  const actor = await requirePermission("settings.manage");

  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyLogo = String(formData.get("companyLogo") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const defaultLowStockThreshold = String(
    formData.get("defaultLowStockThreshold") ?? "0",
  );

  const before = await prisma.setting.findUnique({ where: { id: 1 } });

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName,
      companyLogo,
      address,
      defaultLowStockThreshold,
    },
    update: { companyName, companyLogo, address, defaultLowStockThreshold },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "1",
    before: before
      ? {
          companyName: before.companyName,
          address: before.address,
        }
      : null,
    after: { companyName: setting.companyName, address: setting.address },
  });

  revalidatePath("/settings");
  revalidatePath("/reports");
}

const EDITABLE_PERMISSIONS = PERMISSION_KEYS.filter(
  (key) => !LOCKED_PERMISSIONS.includes(key),
);

export async function updateRolePermissions(formData: FormData) {
  const actor = await requirePermission("settings.manage");

  const before = await prisma.rolePermission.findMany();
  const beforeMap = new Map(
    before.map((row) => [`${row.role}:${row.permission}`, row.allowed]),
  );

  const changes: { role: string; permission: string; allowed: boolean }[] = [];

  for (const role of EDITABLE_ROLES) {
    for (const permission of EDITABLE_PERMISSIONS) {
      const allowed = formData.get(`perm__${role}__${permission}`) === "on";
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        create: { role, permission, allowed },
        update: { allowed },
      });
      const key = `${role}:${permission}`;
      if (beforeMap.get(key) !== allowed) {
        changes.push({ role, permission, allowed });
      }
    }
  }

  if (changes.length > 0) {
    await logAudit({
      userId: actor.id,
      action: "UPDATE",
      entityType: "RolePermission",
      entityId: "bulk",
      after: { changes },
    });
  }

  revalidatePath("/settings");
}
