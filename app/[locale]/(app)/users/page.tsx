import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog } from "./user-form-dialog";

export default async function UsersPage() {
  await requirePermission("user.manage");

  const [t, tCommon, tUsers, users] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("usersPage"),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const roleLabels: Record<string, string> = {
    ADMIN: tUsers("roleAdmin"),
    MANAGER: tUsers("roleManager"),
    STAFF: tUsers("roleStaff"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("users")}</h1>
        <UserFormDialog />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{tUsers("email")}</TableHead>
              <TableHead>{tUsers("role")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="w-1">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleLabels[user.role]}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? tCommon("active") : tCommon("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <UserFormDialog user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
