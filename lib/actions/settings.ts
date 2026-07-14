"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/audit/logAudit";

export async function updateSettings(formData: FormData) {
  const actor = await requirePermission("settings.manage");

  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyLogo = String(formData.get("companyLogo") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const defaultLowStockThreshold = String(
    formData.get("defaultLowStockThreshold") ?? "0",
  );

  const before = await prisma.setting.findUnique({ where: { id: 1 } });

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName,
      companyLogo,
      address,
      defaultLowStockThreshold,
    },
    update: { companyName, companyLogo, address, defaultLowStockThreshold },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "Setting",
    entityId: "1",
    before: before
      ? {
          companyName: before.companyName,
          address: before.address,
        }
      : null,
    after: { companyName: setting.companyName, address: setting.address },
  });

  revalidatePath("/settings");
  revalidatePath("/reports");
}
