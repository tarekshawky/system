import { prisma } from "@/lib/prisma";

export async function getInventoryValuationReport() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, stocks: true },
    orderBy: { sku: "asc" },
  });

  return products.map((p) => {
    const totalStock = p.stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
    const costPrice = Number(p.costPrice);
    return {
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      unit: p.unit,
      quantity: totalStock,
      costPrice,
      value: totalStock * costPrice,
    };
  });
}

export async function getLowStockReport() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, stocks: true },
    orderBy: { sku: "asc" },
  });

  return products
    .map((p) => {
      const totalStock = p.stocks.reduce(
        (sum, s) => sum + Number(s.quantity),
        0,
      );
      return {
        sku: p.sku,
        name: p.name,
        category: p.category.name,
        unit: p.unit,
        quantity: totalStock,
        reorderLevel: Number(p.reorderLevel),
      };
    })
    .filter((p) => p.quantity <= p.reorderLevel);
}

export async function getMovementsReport(params: {
  from?: Date;
  to?: Date;
  warehouseId?: number;
  type?: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
}) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
      ...(params.type ? { type: params.type } : {}),
    },
    include: { product: true, warehouse: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return movements.map((m) => ({
    date: m.createdAt,
    type: m.type,
    sku: m.product.sku,
    productName: m.product.name,
    warehouse: m.warehouse.name,
    quantity: Number(m.quantity),
    referenceNo: m.referenceNo ?? "",
    user: m.user.name,
  }));
}
