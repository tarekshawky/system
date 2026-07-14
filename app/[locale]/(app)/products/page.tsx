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
import { SearchInput } from "@/components/data-table/search-input";
import { SelectFilter } from "@/components/data-table/select-filter";
import { DataTablePagination } from "@/components/data-table/pagination";
import { ProductFormDialog } from "./product-form-dialog";

const PAGE_SIZE = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; categoryId?: string }>;
}) {
  const user = await requireAuth();
  const canWrite = hasPermission(user.role, "product.write");
  const canViewCost = hasPermission(user.role, "cost.view");
  const { q, page: pageParam, categoryId } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { barcode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
  };

  const [t, tCommon, tPage, products, total, categories] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("productsPage"),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: { select: { quantity: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("products")}</h1>
        {canWrite && (
          <ProductFormDialog
            categories={categories}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <SearchInput />
        <SelectFilter
          paramName="categoryId"
          placeholder={tPage("category")}
          allLabel={tCommon("filter")}
          options={categories.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tPage("sku")}</TableHead>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{tPage("category")}</TableHead>
              <TableHead>{tPage("unit")}</TableHead>
              {canViewCost && <TableHead>{tPage("costPrice")}</TableHead>}
              <TableHead>{tPage("sellPrice")}</TableHead>
              <TableHead>{tPage("stock")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="w-1">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canViewCost ? 9 : 8}
                  className="text-center text-muted-foreground"
                >
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const totalStock = product.stocks.reduce(
                (sum, s) => sum + Number(s.quantity),
                0,
              );
              const isLow = totalStock <= Number(product.reorderLevel);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  {canViewCost && (
                    <TableCell>{product.costPrice.toString()}</TableCell>
                  )}
                  <TableCell>{product.sellPrice.toString()}</TableCell>
                  <TableCell>
                    <span className={isLow ? "font-medium text-destructive" : ""}>
                      {totalStock}
                    </span>
                    {isLow && (
                      <Badge variant="destructive" className="ms-2">
                        {tPage("lowStock")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? tCommon("active") : tCommon("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canWrite && (
                      <ProductFormDialog
                        product={{
                          id: product.id,
                          sku: product.sku,
                          name: product.name,
                          categoryId: product.categoryId,
                          unit: product.unit,
                          costPrice: product.costPrice.toString(),
                          sellPrice: product.sellPrice.toString(),
                          reorderLevel: product.reorderLevel.toString(),
                          barcode: product.barcode,
                          description: product.description,
                          isActive: product.isActive,
                        }}
                        categories={categories}
                      />
                    )}
                  </TableCell>
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
