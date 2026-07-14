import { Role } from "@/lib/generated/prisma/enums";

export const PERMISSIONS = {
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
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  role: Role | undefined | null,
  permission: Permission,
): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
