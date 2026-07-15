"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({
  action,
  setting,
  labels,
}: {
  action: (formData: FormData) => Promise<void>;
  setting: {
    companyName: string;
    companyLogo: string | null;
    address: string | null;
    defaultLowStockThreshold: string;
  };
  labels: {
    companyName: string;
    companyLogo: string;
    address: string;
    defaultLowStockThreshold: string;
    save: string;
    saved: string;
    saveFailed: string;
  };
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(labels.saved);
      } catch {
        toast.error(labels.saveFailed);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName">{labels.companyName}</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={setting.companyName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyLogo">{labels.companyLogo}</Label>
        <Input
          id="companyLogo"
          name="companyLogo"
          defaultValue={setting.companyLogo ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">{labels.address}</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={setting.address ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultLowStockThreshold">
          {labels.defaultLowStockThreshold}
        </Label>
        <Input
          id="defaultLowStockThreshold"
          name="defaultLowStockThreshold"
          type="number"
          step="0.001"
          min="0"
          defaultValue={setting.defaultLowStockThreshold}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {labels.save}
      </Button>
    </form>
  );
}
