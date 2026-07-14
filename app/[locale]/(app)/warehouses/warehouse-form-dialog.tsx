"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createWarehouse, updateWarehouse } from "@/lib/actions/warehouses";

type ExistingWarehouse = {
  id: number;
  name: string;
  code: string | null;
  location: string | null;
  isActive: boolean;
};

export function WarehouseFormDialog({
  warehouse,
}: {
  warehouse?: ExistingWarehouse;
}) {
  const t = useTranslations("warehousesPage");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const isEdit = !!warehouse;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateWarehouse(warehouse.id, formData);
    } else {
      await createWarehouse(formData);
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
            {t("createWarehouse")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editWarehouse") : t("createWarehouse")}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tCommon("name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={warehouse?.name}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">{t("code")}</Label>
            <Input id="code" name="code" defaultValue={warehouse?.code ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              name="location"
              defaultValue={warehouse?.location ?? ""}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={warehouse?.isActive}
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
