"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateRolePermissions } from "@/lib/actions/settings";
import type { Permission } from "@/lib/auth/permissions";

export function RolePermissionsForm({
  roles,
  permissions,
  roleLabels,
  permissionLabels,
  initialAllowed,
  labels,
}: {
  roles: readonly string[];
  permissions: readonly Permission[];
  roleLabels: Record<string, string>;
  permissionLabels: Record<Permission, string>;
  initialAllowed: Record<string, boolean>;
  labels: { permission: string; save: string; saved: string; saveFailed: string };
}) {
  const [checked, setChecked] = useState(initialAllowed);
  const [pending, startTransition] = useTransition();

  function toggle(key: string, value: boolean) {
    setChecked((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const formData = new FormData();
    for (const role of roles) {
      for (const permission of permissions) {
        if (checked[`${role}:${permission}`]) {
          formData.set(`perm__${role}__${permission}`, "on");
        }
      }
    }
    startTransition(async () => {
      try {
        await updateRolePermissions(formData);
        toast.success(labels.saved);
      } catch {
        toast.error(labels.saveFailed);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.permission}</TableHead>
            {roles.map((role) => (
              <TableHead key={role} className="text-center">
                {roleLabels[role]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission}>
              <TableCell>{permissionLabels[permission]}</TableCell>
              {roles.map((role) => {
                const key = `${role}:${permission}`;
                return (
                  <TableCell key={role} className="text-center">
                    <Checkbox
                      checked={checked[key] ?? false}
                      onCheckedChange={(value) => toggle(key, value === true)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={handleSave}
      >
        {labels.save}
      </Button>
    </div>
  );
}
