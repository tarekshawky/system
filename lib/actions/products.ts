"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";

function readProductFields(formData: FormData) {
  return {
    sku: String(formData.get("sku") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    categoryId: Number(formData.get("categoryId")),
    unit: String(formData.get("unit") ?? "").trim(),
    costPrice: String(formData.get("costPrice") ?? "0"),
    sellPrice: String(formData.get("sellPrice") ?? "0"),
    reorderLevel: String(formData.get("reorderLevel") ?? "0"),
    barcode: String(formData.get("barcode") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  };
}

export async function createProduct(formData: FormData) {
  const actor = await requirePermission("product.write");
  const fields = readProductFields(formData);

  if (!fields.sku || !fields.name || !fields.unit || !fields.categoryId) {
    throw new Error("Missing required fields");
  }

  const product = await prisma.product.create({ data: fields });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "Product",
    entityId: String(product.id),
    after: { sku: product.sku, name: product.name },
  });

  revalidatePath("/products");
}

export async function updateProduct(productId: number, formData: FormData) {
  const actor = await requirePermission("product.write");
  const before = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });

  const fields = readProductFields(formData);
  const isActive = formData.get("isActive") === "on";

  const product = await prisma.product.update({
    where: { id: productId },
    data: { ...fields, isActive },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Product",
    entityId: String(product.id),
    before: {
      name: before.name,
      costPrice: before.costPrice.toString(),
      sellPrice: before.sellPrice.toString(),
      isActive: before.isActive,
    },
    after: {
      name: product.name,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      isActive: product.isActive,
    },
  });

  revalidatePath("/products");
}
