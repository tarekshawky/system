"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";
import { Role } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function createUser(formData: FormData) {
  const actor = await requirePermission("user.manage");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") as Role;

  if (!name || !email || !password) {
    throw new Error("Missing required fields");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    after: { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/users");
}

export async function updateUser(userId: string, formData: FormData) {
  const actor = await requirePermission("user.manage");
  const before = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const name = String(formData.get("name") ?? before.name).trim();
  const role = (formData.get("role") as Role) ?? before.role;
  const isActive = formData.get("isActive") === "on";
  const password = String(formData.get("password") ?? "");

  const data: Prisma.UserUpdateInput = { name, role, isActive };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({ where: { id: userId }, data });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    before: {
      name: before.name,
      role: before.role,
      isActive: before.isActive,
    },
    after: { name: user.name, role: user.role, isActive: user.isActive },
  });

  revalidatePath("/users");
}
