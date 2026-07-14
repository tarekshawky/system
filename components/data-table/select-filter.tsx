"use client";

import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname } from "@/i18n/navigation";

export function SelectFilter({
  paramName,
  placeholder,
  allLabel,
  options,
}: {
  paramName: string;
  placeholder: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "all";

  const labels: Record<string, string> = { all: allLabel };
  for (const o of options) labels[o.value] = o.label;

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(paramName, value);
    else params.delete(paramName);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder={placeholder}>
          {(value: string | null) => (value ? labels[value] : placeholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
