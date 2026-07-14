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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";

type ExistingCustomer = {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
};

export function CustomerFormDialog({
  customer,
}: {
  customer?: ExistingCustomer;
}) {
  const t = useTranslations("customersPage");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const isEdit = !!customer;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateCustomer(customer.id, formData);
    } else {
      await createCustomer(formData);
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
            {t("createCustomer")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editCustomer") : t("createCustomer")}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tCommon("name")}</Label>
            <Input id="name" name="name" defaultValue={customer?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactName">{t("contactName")}</Label>
            <Input
              id="contactName"
              name="contactName"
              defaultValue={customer?.contactName ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={customer?.address ?? ""}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={customer?.isActive}
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
