import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SelectFilter } from "@/components/data-table/select-filter";
import { DataTablePagination } from "@/components/data-table/pagination";
import { MovementFormDialog } from "./movement-form-dialog";

const PAGE_SIZE = 25;

const TYPE_ORDER = ["IN", "OUT", "TRANSFER", "ADJUSTMENT"] as const;

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    warehouseId?: string;
    page?: string;
  }>;
}) {
  const user = await requireAuth();
  const { type, warehouseId, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const allowedTypes = TYPE_ORDER.filter((t) => {
    if (t === "IN" || t === "OUT")
      return hasPermission(user.role, "movement.inout.create");
    if (t === "TRANSFER")
      return hasPermission(user.role, "movement.transfer.create");
    return hasPermission(user.role, "movement.adjustment.create");
  });

  const where = {
    ...(type ? { type: type as (typeof TYPE_ORDER)[number] } : {}),
    ...(warehouseId ? { warehouseId: Number(warehouseId) } : {}),
  };

  const [t, tCommon, tPage, movements, total, products, warehouses, suppliers, customers] =
    await Promise.all([
      getTranslations("nav"),
      getTranslations("common"),
      getTranslations("movementsPage"),
      prisma.stockMovement.findMany({
        where,
        include: { product: true, warehouse: true, user: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.stockMovement.count({ where }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, sku: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.warehouse.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const typeLabels: Record<string, string> = {
    IN: tPage("typeIn"),
    OUT: tPage("typeOut"),
    TRANSFER: tPage("typeTransfer"),
    ADJUSTMENT: tPage("typeAdjustment"),
  };
  const typeVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    IN: "default",
    OUT: "destructive",
    TRANSFER: "outline",
    ADJUSTMENT: "secondary",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("movements")}</h1>
        {allowedTypes.length > 0 && (
          <MovementFormDialog
            products={products}
            warehouses={warehouses}
            suppliers={suppliers}
            customers={customers}
            allowedTypes={[...allowedTypes]}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <SelectFilter
          paramName="type"
          placeholder={tPage("type")}
          allLabel={tCommon("filter")}
          options={TYPE_ORDER.map((tp) => ({ value: tp, label: typeLabels[tp] }))}
        />
        <SelectFilter
          paramName="warehouseId"
          placeholder={tPage("warehouse")}
          allLabel={tCommon("filter")}
          options={warehouses.map((w) => ({
            value: String(w.id),
            label: w.name,
          }))}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tPage("date")}</TableHead>
              <TableHead>{tPage("type")}</TableHead>
              <TableHead>{tPage("product")}</TableHead>
              <TableHead>{tPage("warehouse")}</TableHead>
              <TableHead>{tPage("quantity")}</TableHead>
              <TableHead>{tPage("referenceNo")}</TableHead>
              <TableHead>{tPage("user")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {movements.map((m) => {
              const qty = Number(m.quantity);
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[m.type]}>
                      {typeLabels[m.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.product.sku} — {m.product.name}
                  </TableCell>
                  <TableCell>{m.warehouse.name}</TableCell>
                  <TableCell
                    className={qty >= 0 ? "text-green-600" : "text-destructive"}
                  >
                    {qty >= 0 ? "+" : ""}
                    {qty}
                  </TableCell>
                  <TableCell>{m.referenceNo}</TableCell>
                  <TableCell>{m.user.name}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination page={page} totalPages={totalPages} />
    </div>
  );
}
