import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementsChart } from "@/components/dashboard/movements-chart";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const canViewCost = hasPermission(user.role, "cost.view");

  const t = await getTranslations("dashboardPage");
  const tNav = await getTranslations("nav");
  const tMovements = await getTranslations("movementsPage");
  const tCommon = await getTranslations("common");

  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalProducts,
    totalWarehouses,
    productsWithStock,
    movementsToday,
    recentMovements,
    trendMovements,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { stocks: true },
    }),
    prisma.stockMovement.count({ where: { createdAt: { gte: today } } }),
    prisma.stockMovement.findMany({
      include: { product: true, warehouse: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        type: { in: ["IN", "OUT"] },
      },
      select: { createdAt: true, type: true, quantity: true },
    }),
  ]);

  let stockValue = 0;
  let totalUnits = 0;
  const lowStockProducts: {
    id: number;
    name: string;
    sku: string;
    totalStock: number;
    reorderLevel: number;
  }[] = [];

  for (const product of productsWithStock) {
    const total = product.stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
    totalUnits += total;
    stockValue += total * Number(product.costPrice);
    if (total <= Number(product.reorderLevel)) {
      lowStockProducts.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        totalStock: total,
        reorderLevel: Number(product.reorderLevel),
      });
    }
  }

  const dayBuckets: { date: string; in: number; out: number }[] = [];
  const dayFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dayBuckets.push({ date: dayFormatter.format(d), in: 0, out: 0 });
  }
  for (const m of trendMovements) {
    const dayIndex = Math.floor(
      (startOfDay(m.createdAt).getTime() - sevenDaysAgo.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (dayIndex < 0 || dayIndex > 6) continue;
    const qty = Math.abs(Number(m.quantity));
    if (m.type === "IN") dayBuckets[dayIndex].in += qty;
    else dayBuckets[dayIndex].out += qty;
  }

  const typeLabels: Record<string, string> = {
    IN: tMovements("typeIn"),
    OUT: tMovements("typeOut"),
    TRANSFER: tMovements("typeTransfer"),
    ADJUSTMENT: tMovements("typeAdjustment"),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{tNav("dashboard")}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalProducts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalProducts}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalWarehouses")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalWarehouses}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("lowStockCount")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {lowStockProducts.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {canViewCost ? t("stockValue") : t("totalStockUnits")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {canViewCost ? stockValue.toFixed(2) : totalUnits}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("movementsToday")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {movementsToday}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{t("movementsTrend")}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <MovementsChart
              data={dayBuckets}
              inLabel={tMovements("typeIn")}
              outLabel={tMovements("typeOut")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("lowStockAlerts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noLowStock")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tCommon("name")}</TableHead>
                    <TableHead>{t("lowStockCount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.slice(0, 6).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.sku} — {p.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          <span dir="ltr">
                            {p.totalStock} / {p.reorderLevel}
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Link
              href="/products"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tMovements("date")}</TableHead>
                  <TableHead>{tMovements("type")}</TableHead>
                  <TableHead>{tMovements("product")}</TableHead>
                  <TableHead>{tMovements("warehouse")}</TableHead>
                  <TableHead>{tMovements("quantity")}</TableHead>
                  <TableHead>{tMovements("user")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.map((m) => {
                  const qty = Number(m.quantity);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(m.createdAt)}
                      </TableCell>
                      <TableCell>{typeLabels[m.type]}</TableCell>
                      <TableCell>
                        {m.product.sku} — {m.product.name}
                      </TableCell>
                      <TableCell>{m.warehouse.name}</TableCell>
                      <TableCell
                        className={
                          qty >= 0 ? "text-green-600" : "text-destructive"
                        }
                      >
                        {qty >= 0 ? "+" : ""}
                        {qty}
                      </TableCell>
                      <TableCell>{m.user.name}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <Link
            href="/movements"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            {t("viewAll")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
