"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SALES_CHANNELS } from "@/lib/sales-channel";

/** Writes to the ?salesChannel= URL param, matching SearchInput's pattern. */
export function SalesChannelFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("salesChannel");
  const selected = SALES_CHANNELS.find((c) => c.value === current);

  function setChannel(value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("salesChannel", value);
    } else {
      params.delete("salesChannel");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button" className="h-9">
          {selected?.label ?? "All channels"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setChannel(undefined)}>All channels</DropdownMenuItem>
        {SALES_CHANNELS.map((c) => (
          <DropdownMenuItem key={c.value} onSelect={() => setChannel(c.value)}>
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
