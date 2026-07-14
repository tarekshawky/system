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

export async function createCustomer(formData: FormData) {
  const actor = await requirePermission("customer.write");
  const fields = readFields(formData);
  if (!fields.name) throw new Error("Missing required fields");

  const customer = await prisma.customer.create({ data: fields });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "Customer",
    entityId: String(customer.id),
    after: { name: customer.name },
  });

  revalidatePath("/customers");
}

export async function updateCustomer(customerId: number, formData: FormData) {
  const actor = await requirePermission("customer.write");
  const before = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
  });

  const fields = readFields(formData);
  const isActive = formData.get("isActive") === "on";

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { ...fields, isActive },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Customer",
    entityId: String(customer.id),
    before: { name: before.name, isActive: before.isActive },
    after: { name: customer.name, isActive: customer.isActive },
  });

  revalidatePath("/customers");
}
