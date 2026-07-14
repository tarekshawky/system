"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createMovementAction } from "@/lib/actions/movements";

type Option = { id: number; name: string };
type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export function MovementFormDialog({
  products,
  warehouses,
  suppliers,
  customers,
  allowedTypes,
}: {
  products: (Option & { sku: string })[];
  warehouses: Option[];
  suppliers: Option[];
  customers: Option[];
  allowedTypes: MovementType[];
}) {
  const t = useTranslations("movementsPage");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MovementType>(allowedTypes[0]);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await createMovementAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setOpen(false);
      }
    });
  }

  const typeLabels: Record<MovementType, string> = {
    IN: t("typeIn"),
    OUT: t("typeOut"),
    TRANSFER: t("typeTransfer"),
    ADJUSTMENT: t("typeAdjustment"),
  };

  const productLabels: Record<string, string> = {};
  for (const p of products) productLabels[String(p.id)] = `${p.sku} — ${p.name}`;
  const warehouseLabels: Record<string, string> = {};
  for (const w of warehouses) warehouseLabels[String(w.id)] = w.name;
  const supplierLabels: Record<string, string> = { none: t("optional") };
  for (const s of suppliers) supplierLabels[String(s.id)] = s.name;
  const customerLabels: Record<string, string> = { none: t("optional") };
  for (const c of customers) customerLabels[String(c.id)] = c.name;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setType(allowedTypes[0]);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        {t("createMovement")}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createMovement")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">{t("type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as MovementType)}
            >
              <SelectTrigger id="type">
                <SelectValue>
                  {(value: MovementType | null) =>
                    value ? typeLabels[value] : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {typeLabels[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="productId">{t("product")}</Label>
            <Select name="productId">
              <SelectTrigger id="productId">
                <SelectValue>
                  {(value: string | null) => (value ? productLabels[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.sku} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="warehouseId">{t("warehouse")}</Label>
              <Select name="warehouseId">
                <SelectTrigger id="warehouseId">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? warehouseLabels[value] : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === "TRANSFER" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="destWarehouseId">{t("destWarehouse")}</Label>
                <Select name="destWarehouseId">
                  <SelectTrigger id="destWarehouseId">
                    <SelectValue>
                      {(value: string | null) =>
                        value ? warehouseLabels[value] : ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "IN" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="supplierId">{t("supplier")}</Label>
                <Select name="supplierId" defaultValue="none">
                  <SelectTrigger id="supplierId">
                    <SelectValue>
                      {(value: string | null) =>
                        value ? supplierLabels[value] : ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("optional")}</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "OUT" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="customerId">{t("customer")}</Label>
                <Select name="customerId" defaultValue="none">
                  <SelectTrigger id="customerId">
                    <SelectValue>
                      {(value: string | null) =>
                        value ? customerLabels[value] : ""
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("optional")}</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">
              {type === "ADJUSTMENT" ? t("quantityDelta") : t("quantity")}
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.001"
              min={type === "ADJUSTMENT" ? undefined : "0.001"}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="referenceNo">{t("referenceNo")}</Label>
              <Input id="referenceNo" name="referenceNo" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">{t("note")}</Label>
            <Textarea id="note" name="note" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(error as "insufficientStock" | "invalidTransfer")}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
