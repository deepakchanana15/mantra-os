"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPES = [
  { value: "", label: "All types" },
  { value: "COMPANY", label: "Company" },
  { value: "INDIVIDUAL", label: "Individual" },
];

export function CustomerTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("type") ?? "";
  const currentLabel = TYPES.find((t) => t.value === current)?.label ?? "All types";

  function setType(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="border border-border">
          <Filter className="h-3.5 w-3.5" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {TYPES.map((t) => (
          <DropdownMenuItem key={t.value} onSelect={() => setType(t.value)}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
