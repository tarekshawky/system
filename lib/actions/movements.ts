"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

async function adjustStock(
  tx: Tx,
  productId: number,
  warehouseId: number,
  delta: number,
) {
  if (delta === 0) return;

  if (delta > 0) {
    await tx.stock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity: delta },
      update: { quantity: { increment: delta } },
    });
    return;
  }

  const current = await tx.stock.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
  const currentQty = current ? Number(current.quantity) : 0;
  if (currentQty + delta < 0) {
    throw new Error("INSUFFICIENT_STOCK");
  }
  await tx.stock.update({
    where: { productId_warehouseId: { productId, warehouseId } },
    data: { quantity: { increment: delta } },
  });
}

export type MovementFormState = { error?: string } | undefined;

export async function createMovementAction(
  _prevState: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  try {
    await createMovement(formData);
    return undefined;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_STOCK") {
        return { error: "insufficientStock" };
      }
      if (error.message === "Invalid transfer") {
        return { error: "invalidTransfer" };
      }
    }
    throw error;
  }
}

async function createMovement(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const productId = Number(formData.get("productId"));
  const quantityInput = Number(formData.get("quantity"));
  const referenceNo = String(formData.get("referenceNo") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || !Number.isFinite(quantityInput)) {
    throw new Error("Missing required fields");
  }

  if (type === "IN" || type === "OUT") {
    const actor = await requirePermission("movement.inout.create");
    const warehouseId = Number(formData.get("warehouseId"));
    if (!warehouseId || quantityInput <= 0) {
      throw new Error("Missing required fields");
    }
    const signedQuantity = type === "IN" ? quantityInput : -quantityInput;
    const counterpartyType =
      type === "IN"
        ? formData.get("supplierId")
          ? ("SUPPLIER" as const)
          : null
        : formData.get("customerId")
          ? ("CUSTOMER" as const)
          : null;
    const counterpartyId =
      type === "IN"
        ? Number(formData.get("supplierId")) || null
        : Number(formData.get("customerId")) || null;

    await prisma.$transaction(async (tx) => {
      await adjustStock(tx, productId, warehouseId, signedQuantity);
      await tx.stockMovement.create({
        data: {
          type,
          productId,
          warehouseId,
          quantity: signedQuantity,
          counterpartyType,
          counterpartyId,
          referenceNo,
          note,
          userId: actor.id,
        },
      });
    });

    await logAudit({
      userId: actor.id,
      action: type === "IN" ? "STOCK_IN" : "STOCK_OUT",
      entityType: "StockMovement",
      entityId: `${productId}:${warehouseId}`,
      after: { productId, warehouseId, quantity: signedQuantity },
    });
  } else if (type === "TRANSFER") {
    const actor = await requirePermission("movement.transfer.create");
    const sourceWarehouseId = Number(formData.get("warehouseId"));
    const destWarehouseId = Number(formData.get("destWarehouseId"));
    if (
      !sourceWarehouseId ||
      !destWarehouseId ||
      sourceWarehouseId === destWarehouseId ||
      quantityInput <= 0
    ) {
      throw new Error("Invalid transfer");
    }

    const transferGroupId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await adjustStock(tx, productId, sourceWarehouseId, -quantityInput);
      await adjustStock(tx, productId, destWarehouseId, quantityInput);
      await tx.stockMovement.create({
        data: {
          type: "TRANSFER",
          productId,
          warehouseId: sourceWarehouseId,
          relatedWarehouseId: destWarehouseId,
          transferGroupId,
          quantity: -quantityInput,
          referenceNo,
          note,
          userId: actor.id,
        },
      });
      await tx.stockMovement.create({
        data: {
          type: "TRANSFER",
          productId,
          warehouseId: destWarehouseId,
          relatedWarehouseId: sourceWarehouseId,
          transferGroupId,
          quantity: quantityInput,
          referenceNo,
          note,
          userId: actor.id,
        },
      });
    });

    await logAudit({
      userId: actor.id,
      action: "STOCK_TRANSFER",
      entityType: "StockMovement",
      entityId: transferGroupId,
      after: {
        productId,
        sourceWarehouseId,
        destWarehouseId,
        quantity: quantityInput,
      },
    });
  } else if (type === "ADJUSTMENT") {
    const actor = await requirePermission("movement.adjustment.create");
    const warehouseId = Number(formData.get("warehouseId"));
    if (!warehouseId || quantityInput === 0) {
      throw new Error("Missing required fields");
    }

    await prisma.$transaction(async (tx) => {
      await adjustStock(tx, productId, warehouseId, quantityInput);
      await tx.stockMovement.create({
        data: {
          type: "ADJUSTMENT",
          productId,
          warehouseId,
          quantity: quantityInput,
          referenceNo,
          note,
          userId: actor.id,
        },
      });
    });

    await logAudit({
      userId: actor.id,
      action: "STOCK_ADJUSTMENT",
      entityType: "StockMovement",
      entityId: `${productId}:${warehouseId}`,
      after: { productId, warehouseId, quantity: quantityInput },
    });
  } else {
    throw new Error("Invalid movement type");
  }

  revalidatePath("/movements");
  revalidatePath("/products");
  revalidatePath("/dashboard");
}
