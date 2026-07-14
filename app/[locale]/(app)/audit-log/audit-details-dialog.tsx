"use client";

import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Prisma } from "@/lib/generated/prisma/client";

export function AuditDetailsDialog({
  before,
  after,
}: {
  before: Prisma.JsonValue;
  after: Prisma.JsonValue;
}) {
  const t = useTranslations("auditLogPage");

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Eye className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("details")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {before != null && (
            <div>
              <p className="mb-1 text-sm font-medium">{t("before")}</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs" dir="ltr">
                {JSON.stringify(before, null, 2)}
              </pre>
            </div>
          )}
          {after != null && (
            <div>
              <p className="mb-1 text-sm font-medium">{t("after")}</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs" dir="ltr">
                {JSON.stringify(after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
