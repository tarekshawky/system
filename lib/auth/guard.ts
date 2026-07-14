import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, type Permission } from "./permissions";

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!hasPermission(session.user.role, permission)) forbidden();
  return session.user;
}

/** For pages any authenticated role may view (read access to master data). */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) unauthorized();
  return session.user;
}
