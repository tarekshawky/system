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
import { DataTablePagination } from "@/components/data-table/pagination";
import { CategoryFormDialog } from "./category-form-dialog";

const PAGE_SIZE = 20;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireAuth();
  const canWrite = hasPermission(user.role, "category.write");
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : {};

  const [t, tCommon, tPage, categories, total, allCategories] =
    await Promise.all([
      getTranslations("nav"),
      getTranslations("common"),
      getTranslations("categoriesPage"),
      prisma.category.findMany({
        where,
        include: { parent: true },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.category.count({ where }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("categories")}</h1>
        {canWrite && <CategoryFormDialog categories={allCategories} />}
      </div>
      <SearchInput />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{tPage("parentCategory")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="w-1">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.parent?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? tCommon("active") : tCommon("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {canWrite && (
                    <CategoryFormDialog
                      category={category}
                      categories={allCategories}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination page={page} totalPages={totalPages} />
    </div>
  );
}
