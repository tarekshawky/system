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
import { createUser, updateUser } from "@/lib/actions/users";
import { Role } from "@/lib/generated/prisma/enums";

type ExistingUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export function UserFormDialog({ user }: { user?: ExistingUser }) {
  const t = useTranslations("usersPage");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const isEdit = !!user;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateUser(user.id, formData);
    } else {
      await createUser(formData);
    }
    setOpen(false);
  }

  const roleLabels: Record<Role, string> = {
    [Role.ADMIN]: t("roleAdmin"),
    [Role.MANAGER]: t("roleManager"),
    [Role.STAFF]: t("roleStaff"),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? (
          tCommon("edit")
        ) : (
          <>
            <Plus className="size-4" />
            {t("createUser")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editUser") : t("createUser")}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{tCommon("name")}</Label>
            <Input id="name" name="name" defaultValue={user?.name} required />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              {isEdit ? t("passwordOptional") : tAuth("password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!isEdit}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">{t("role")}</Label>
            <Select name="role" defaultValue={user?.role ?? Role.STAFF}>
              <SelectTrigger id="role">
                <SelectValue>
                  {(value: Role | null) => (value ? roleLabels[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(Role).map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
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
                key={user?.isActive ? "active" : "inactive"}
                defaultChecked={user?.isActive}
              />
              <Label htmlFor="isActive">{t("isActive")}</Label>
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
