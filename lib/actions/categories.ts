"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";

function parseParentId(formData: FormData): number | null {
  const raw = String(formData.get("parentId") ?? "");
  if (!raw || raw === "none") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function createCategory(formData: FormData) {
  const actor = await requirePermission("category.write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Missing required fields");
  const parentId = parseParentId(formData);

  const category = await prisma.category.create({
    data: { name, parentId },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "Category",
    entityId: String(category.id),
    after: { name: category.name, parentId: category.parentId },
  });

  revalidatePath("/categories");
}

export async function updateCategory(categoryId: number, formData: FormData) {
  const actor = await requirePermission("category.write");
  const before = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
  });

  const name = String(formData.get("name") ?? before.name).trim();
  const isActive = formData.get("isActive") === "on";
  let parentId = parseParentId(formData);
  if (parentId === categoryId) parentId = before.parentId;

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: { name, parentId, isActive },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Category",
    entityId: String(category.id),
    before: {
      name: before.name,
      parentId: before.parentId,
      isActive: before.isActive,
    },
    after: {
      name: category.name,
      parentId: category.parentId,
      isActive: category.isActive,
    },
  });

  revalidatePath("/categories");
}
