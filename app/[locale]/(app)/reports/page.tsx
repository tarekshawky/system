import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getInventoryValuationReport,
  getLowStockReport,
  getMovementsReport,
} from "@/lib/reports/queries";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet } from "lucide-react";

type ReportType = "inventory" | "low-stock" | "movements";

function ExportButtons({
  report,
  locale,
  exportPdfLabel,
  exportExcelLabel,
}: {
  report: ReportType;
  locale: string;
  exportPdfLabel: string;
  exportExcelLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a href={`/api/reports/${report}?format=pdf&locale=${locale}`} />
        }
      >
        <Download className="size-4" />
        {exportPdfLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a href={`/api/reports/${report}?format=excel&locale=${locale}`} />
        }
      >
        <FileSpreadsheet className="size-4" />
        {exportExcelLabel}
      </Button>
    </div>
  );
}

export default async function ReportsPage() {
  const user = await requireAuth();
  const canViewCost = hasPermission(user.role, "cost.view");
  const locale = await getLocale();

  const t = await getTranslations("reportsPage");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const [lowStock, movements, valuation, settings] = await Promise.all([
    getLowStockReport(),
    getMovementsReport({}),
    canViewCost ? getInventoryValuationReport() : Promise.resolve([]),
    prisma.setting.findUnique({ where: { id: 1 } }),
  ]);

  const typeLabels: Record<string, string> = {
    IN: t("typeIn"),
    OUT: t("typeOut"),
    TRANSFER: t("typeTransfer"),
    ADJUSTMENT: t("typeAdjustment"),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{tNav("reports")}</h1>

      <Tabs defaultValue={canViewCost ? "inventory" : "low-stock"}>
        <TabsList>
          {canViewCost && (
            <TabsTrigger value="inventory">
              {t("inventoryValuation")}
            </TabsTrigger>
          )}
          <TabsTrigger value="low-stock">{t("lowStockReport")}</TabsTrigger>
          <TabsTrigger value="movements">{t("movementsReport")}</TabsTrigger>
        </TabsList>

        {canViewCost && (
          <TabsContent value="inventory" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {settings?.companyName}
              </p>
              <ExportButtons
                report="inventory"
                locale={locale}
                exportPdfLabel={t("exportPdf")}
                exportExcelLabel={t("exportExcel")}
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sku")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("costPrice")}</TableHead>
                    <TableHead>{t("value")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuation.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        {tCommon("noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                  {valuation.map((r) => (
                    <TableRow key={r.sku}>
                      <TableCell>{r.sku}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.quantity}</TableCell>
                      <TableCell>{r.costPrice.toFixed(2)}</TableCell>
                      <TableCell>{r.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        <TabsContent value="low-stock" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons
              report="low-stock"
              locale={locale}
              exportPdfLabel={t("exportPdf")}
              exportExcelLabel={t("exportExcel")}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("sku")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("reorderLevel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                )}
                {lowStock.map((r) => (
                  <TableRow key={r.sku}>
                    <TableCell>{r.sku}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{r.reorderLevel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons
              report="movements"
              locale={locale}
              exportPdfLabel={t("exportPdf")}
              exportExcelLabel={t("exportExcel")}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("sku")}</TableHead>
                  <TableHead>{t("warehouse")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("user")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                )}
                {movements.slice(0, 50).map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(m.date)}
                    </TableCell>
                    <TableCell>{typeLabels[m.type]}</TableCell>
                    <TableCell>{m.sku}</TableCell>
                    <TableCell>{m.warehouse}</TableCell>
                    <TableCell
                      className={
                        m.quantity >= 0 ? "text-green-600" : "text-destructive"
                      }
                    >
                      <span dir="ltr">
                        {m.quantity >= 0 ? "+" : ""}
                        {m.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{m.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
