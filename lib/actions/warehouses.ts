"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";

export async function createWarehouse(formData: FormData) {
  const actor = await requirePermission("warehouse.write");

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!name) throw new Error("Missing required fields");

  const warehouse = await prisma.warehouse.create({
    data: { name, code, location },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "Warehouse",
    entityId: String(warehouse.id),
    after: { name: warehouse.name, code: warehouse.code },
  });

  revalidatePath("/warehouses");
}

export async function updateWarehouse(warehouseId: number, formData: FormData) {
  const actor = await requirePermission("warehouse.write");
  const before = await prisma.warehouse.findUniqueOrThrow({
    where: { id: warehouseId },
  });

  const name = String(formData.get("name") ?? before.name).trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  const warehouse = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: { name, code, location, isActive },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Warehouse",
    entityId: String(warehouse.id),
    before: {
      name: before.name,
      code: before.code,
      location: before.location,
      isActive: before.isActive,
    },
    after: {
      name: warehouse.name,
      code: warehouse.code,
      location: warehouse.location,
      isActive: warehouse.isActive,
    },
  });

  revalidatePath("/warehouses");
}
