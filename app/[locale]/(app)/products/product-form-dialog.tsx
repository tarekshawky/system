"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createProduct, updateProduct } from "@/lib/actions/products";

type ExistingProduct = {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  unit: string;
  costPrice: string;
  sellPrice: string;
  reorderLevel: string;
  barcode: string | null;
  description: string | null;
  isActive: boolean;
};

export function ProductFormDialog({
  product,
  categories,
}: {
  product?: ExistingProduct;
  categories: { id: number; name: string }[];
}) {
  const t = useTranslations("productsPage");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const isEdit = !!product;

  const categoryLabels: Record<string, string> = {};
  for (const c of categories) categoryLabels[String(c.id)] = c.name;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateProduct(product.id, formData);
    } else {
      await createProduct(formData);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={isEdit ? <Button variant="outline" size="sm" /> : <Button />}
      >
        {isEdit ? (
          tCommon("edit")
        ) : (
          <>
            <Plus className="size-4" />
            {t("createProduct")}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editProduct") : t("createProduct")}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">{t("sku")}</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{tCommon("name")}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoryId">{t("category")}</Label>
              <Select
                name="categoryId"
                defaultValue={
                  product?.categoryId ? String(product.categoryId) : undefined
                }
              >
                <SelectTrigger id="categoryId">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? categoryLabels[value] : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">{t("unit")}</Label>
              <Input id="unit" name="unit" defaultValue={product?.unit} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="costPrice">{t("costPrice")}</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.costPrice}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sellPrice">{t("sellPrice")}</Label>
              <Input
                id="sellPrice"
                name="sellPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.sellPrice}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderLevel">{t("reorderLevel")}</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                step="0.001"
                min="0"
                defaultValue={product?.reorderLevel ?? "0"}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="barcode">{t("barcode")}</Label>
            <Input
              id="barcode"
              name="barcode"
              defaultValue={product?.barcode ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                key={product?.isActive ? "active" : "inactive"}
                defaultChecked={product?.isActive}
              />
              <Label htmlFor="isActive">{tCommon("active")}</Label>
            </div>
          )}
          <DialogFooter>
            <Button type="submit">{tCommon("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
