import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";
import {
  getInventoryValuationReport,
  getLowStockReport,
  getMovementsReport,
} from "@/lib/reports/queries";
import { renderReportHtml } from "@/lib/reports/html";
import { htmlToPdf } from "@/lib/reports/pdf";
import { rowsToExcelBuffer } from "@/lib/reports/excel";

type ReportType = "inventory" | "low-stock" | "movements";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!["inventory", "low-stock", "movements"].includes(type)) {
    return new Response("Not found", { status: 404 });
  }
  const reportType = type as ReportType;

  const actor = await requirePermission("report.view");
  if (reportType === "inventory") {
    await requirePermission("cost.view");
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") === "excel" ? "excel" : "pdf";
  const locale = searchParams.get("locale") === "en" ? "en" : "ar";

  const t = await getTranslations({ locale, namespace: "reportsPage" });
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  const companyName = setting?.companyName || "";
  const generatedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  let title: string;
  let columns: { key: string; label: string; align?: "start" | "end" }[];
  let rows: Record<string, string | number>[];

  if (reportType === "inventory") {
    title = t("inventoryValuation");
    columns = [
      { key: "sku", label: t("sku") },
      { key: "name", label: t("name") },
      { key: "category", label: t("category") },
      { key: "unit", label: t("unit") },
      { key: "quantity", label: t("quantity"), align: "end" },
      { key: "costPrice", label: t("costPrice"), align: "end" },
      { key: "value", label: t("value"), align: "end" },
    ];
    const data = await getInventoryValuationReport();
    rows = data.map((r) => ({
      ...r,
      costPrice: r.costPrice.toFixed(2),
      value: r.value.toFixed(2),
    }));
  } else if (reportType === "low-stock") {
    title = t("lowStockReport");
    columns = [
      { key: "sku", label: t("sku") },
      { key: "name", label: t("name") },
      { key: "category", label: t("category") },
      { key: "unit", label: t("unit") },
      { key: "quantity", label: t("quantity"), align: "end" },
      { key: "reorderLevel", label: t("reorderLevel"), align: "end" },
    ];
    rows = await getLowStockReport();
  } else {
    title = t("movementsReport");
    columns = [
      { key: "date", label: t("date") },
      { key: "type", label: t("type") },
      { key: "sku", label: t("sku") },
      { key: "productName", label: t("name") },
      { key: "warehouse", label: t("warehouse") },
      { key: "quantity", label: t("quantity"), align: "end" },
      { key: "referenceNo", label: t("referenceNo") },
      { key: "user", label: t("user") },
    ];
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const warehouseId = searchParams.get("warehouseId");
    const movementType = searchParams.get("type") as
      | "IN"
      | "OUT"
      | "TRANSFER"
      | "ADJUSTMENT"
      | null;
    const typeLabels: Record<string, string> = {
      IN: t("typeIn"),
      OUT: t("typeOut"),
      TRANSFER: t("typeTransfer"),
      ADJUSTMENT: t("typeAdjustment"),
    };
    const data = await getMovementsReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      type: movementType ?? undefined,
    });
    rows = data.map((r) => ({
      ...r,
      date: new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(r.date),
      type: typeLabels[r.type] ?? r.type,
    }));
  }

  await logAudit({
    userId: actor.id,
    action: "EXPORT",
    entityType: "Report",
    entityId: reportType,
    after: { format, rowCount: rows.length },
  });

  const filename = `${reportType}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "excel") {
    const buffer = await rowsToExcelBuffer({ title, columns, rows });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const html = renderReportHtml({
    title,
    companyName,
    locale,
    columns,
    rows,
    generatedAt: `${t("generatedAt")}: ${generatedAt}`,
  });
  const pdf = await htmlToPdf(html);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
