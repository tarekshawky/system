import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
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
import { AuditDetailsDialog } from "./audit-details-dialog";

const PAGE_SIZE = 25;

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "STOCK_IN",
  "STOCK_OUT",
  "STOCK_TRANSFER",
  "STOCK_ADJUSTMENT",
  "EXPORT",
] as const;

const ENTITY_TYPES = [
  "User",
  "Warehouse",
  "Category",
  "Product",
  "Supplier",
  "Customer",
  "StockMovement",
  "Report",
] as const;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    page?: string;
  }>;
}) {
  await requirePermission("auditlog.view");
  const { action, entityType, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = {
    ...(action ? { action: action as (typeof ACTIONS)[number] } : {}),
    ...(entityType ? { entityType } : {}),
  };

  const [t, tNav, tCommon, logs, total] = await Promise.all([
    getTranslations("auditLogPage"),
    getTranslations("nav"),
    getTranslations("common"),
    prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actionLabels: Record<string, string> = {
    CREATE: t("actionCreate"),
    UPDATE: t("actionUpdate"),
    DELETE: t("actionDelete"),
    LOGIN: t("actionLogin"),
    LOGOUT: t("actionLogout"),
    STOCK_IN: t("actionStockIn"),
    STOCK_OUT: t("actionStockOut"),
    STOCK_TRANSFER: t("actionStockTransfer"),
    STOCK_ADJUSTMENT: t("actionStockAdjustment"),
    EXPORT: t("actionExport"),
  };

  const actionVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    CREATE: "default",
    UPDATE: "secondary",
    DELETE: "destructive",
    LOGIN: "outline",
    LOGOUT: "outline",
    STOCK_IN: "default",
    STOCK_OUT: "destructive",
    STOCK_TRANSFER: "outline",
    STOCK_ADJUSTMENT: "secondary",
    EXPORT: "outline",
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{tNav("auditLog")}</h1>

      <div className="flex flex-wrap gap-2">
        <SelectFilter
          paramName="action"
          placeholder={t("action")}
          allLabel={tCommon("filter")}
          options={ACTIONS.map((a) => ({ value: a, label: actionLabels[a] }))}
        />
        <SelectFilter
          paramName="entityType"
          placeholder={t("entityType")}
          allLabel={tCommon("filter")}
          options={ENTITY_TYPES.map((e) => ({ value: e, label: e }))}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("entityType")}</TableHead>
              <TableHead>{t("entityId")}</TableHead>
              <TableHead className="w-1">{t("details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(log.createdAt)}
                </TableCell>
                <TableCell>{log.user?.name ?? t("system")}</TableCell>
                <TableCell>
                  <Badge variant={actionVariant[log.action]}>
                    {actionLabels[log.action]}
                  </Badge>
                </TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell className="font-mono text-xs">
                  {log.entityId}
                </TableCell>
                <TableCell>
                  {(log.before != null || log.after != null) && (
                    <AuditDetailsDialog before={log.before} after={log.after} />
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
