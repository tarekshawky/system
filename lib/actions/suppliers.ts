"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  };
}

export async function createSupplier(formData: FormData) {
  const actor = await requirePermission("supplier.write");
  const fields = readFields(formData);
  if (!fields.name) throw new Error("Missing required fields");

  const supplier = await prisma.supplier.create({ data: fields });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "Supplier",
    entityId: String(supplier.id),
    after: { name: supplier.name },
  });

  revalidatePath("/suppliers");
}

export async function updateSupplier(supplierId: number, formData: FormData) {
  const actor = await requirePermission("supplier.write");
  const before = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
  });

  const fields = readFields(formData);
  const isActive = formData.get("isActive") === "on";

  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: { ...fields, isActive },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Supplier",
    entityId: String(supplier.id),
    before: { name: before.name, isActive: before.isActive },
    after: { name: supplier.name, isActive: supplier.isActive },
  });

  revalidatePath("/suppliers");
}
