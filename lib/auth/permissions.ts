import { cache } from "react";
import { Role } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const PERMISSION_KEYS = [
  "user.manage",
  "warehouse.write",
  "category.write",
  "product.write",
  "supplier.write",
  "customer.write",
  "movement.inout.create",
  "movement.transfer.create",
  "movement.adjustment.create",
  "report.view",
  "cost.view",
  "auditlog.view",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];

/** Baseline used to seed RolePermission rows and as a fallback if a row is missing. */
export const DEFAULT_PERMISSIONS: Record<Permission, readonly Role[]> = {
  "user.manage": [Role.ADMIN],
  "warehouse.write": [Role.ADMIN, Role.MANAGER],
  "category.write": [Role.ADMIN, Role.MANAGER],
  "product.write": [Role.ADMIN, Role.MANAGER],
  "supplier.write": [Role.ADMIN, Role.MANAGER],
  "customer.write": [Role.ADMIN, Role.MANAGER],
  "movement.inout.create": [Role.ADMIN, Role.MANAGER, Role.STAFF],
  "movement.transfer.create": [Role.ADMIN, Role.MANAGER],
  "movement.adjustment.create": [Role.ADMIN, Role.MANAGER],
  "report.view": [Role.ADMIN, Role.MANAGER, Role.STAFF],
  "cost.view": [Role.ADMIN, Role.MANAGER],
  "auditlog.view": [Role.ADMIN],
  "settings.manage": [Role.ADMIN],
};

/**
 * Security-critical permissions the Admin cannot hand to Manager/Staff from the
 * settings UI — user management, the audit log, and settings itself must stay
 * exclusive to Admin or a Manager/Staff account could self-elevate.
 */
export const LOCKED_PERMISSIONS: readonly Permission[] = [
  "user.manage",
  "auditlog.view",
  "settings.manage",
];

export const EDITABLE_ROLES = [Role.MANAGER, Role.STAFF] as const;

/** Per-request-deduped read of Manager/Staff permission overrides. */
export const getRolePermissionOverrides = cache(async () => {
  const rows = await prisma.rolePermission.findMany();
  const overrides = new Map<string, boolean>();
  for (const row of rows) {
    overrides.set(`${row.role}:${row.permission}`, row.allowed);
  }
  return overrides;
});

export async function hasPermission(
  role: Role | undefined | null,
  permission: Permission,
): Promise<boolean> {
  if (!role) return false;
  if (role === Role.ADMIN) return true;

  if (LOCKED_PERMISSIONS.includes(permission)) {
    return DEFAULT_PERMISSIONS[permission].includes(role);
  }

  const overrides = await getRolePermissionOverrides();
  const key = `${role}:${permission}`;
  if (overrides.has(key)) return overrides.get(key)!;
  return DEFAULT_PERMISSIONS[permission].includes(role);
}
