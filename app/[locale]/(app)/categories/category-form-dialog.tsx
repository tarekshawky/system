"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCategory, updateCategory } from "@/lib/actions/categories";

type ExistingCategory = {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
};

export function CategoryFormDialog({
  category,
  categories,
}: {
  category?: ExistingCategory;
  categories: { id: number; name: string }[];
}) {
  const t = useTranslations("categoriesPage");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const isEdit = !!category;

  const parentOptions = categories.filter((c) => c.id !== category?.id);
  const labelsByValue: Record<string, string> = { none: t("noParent") };
  for (const c of parentOptions) labelsByValue[String(c.id)] = c.name;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateCategory(category.id, formData);
    } else {
      await createCategory(formData);
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
            {t("createCategory")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editCategory") : t("createCategory")}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tCommon("name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="parentId">{t("parentCategory")}</Label>
            <Select
              name="parentId"
              defaultValue={
                category?.parentId ? String(category.parentId) : "none"
              }
            >
              <SelectTrigger id="parentId">
                <SelectValue>
                  {(value: string | null) =>
                    value ? labelsByValue[value] : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noParent")}</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                key={category?.isActive ? "active" : "inactive"}
                defaultChecked={category?.isActive}
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
