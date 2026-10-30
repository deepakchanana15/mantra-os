"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const SORT_OPTIONS = [
  { sortBy: "createdAt", sortDir: "desc", label: "Newest first" },
  { sortBy: "createdAt", sortDir: "asc", label: "Oldest first" },
  { sortBy: "stage", sortDir: "asc", label: "Stage (early → late)" },
  { sortBy: "stage", sortDir: "desc", label: "Stage (late → early)" },
  { sortBy: "stageChangedAt", sortDir: "desc", label: "Stage changed, newest first" },
  { sortBy: "name", sortDir: "asc", label: "Name (A → Z)" },
] as const;

/** URL-param-driven, same pattern as CustomerTypeFilter — resets to page 1 (skip=0) on every sort change. */
export function OpportunitySortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSortBy = searchParams.get("sortBy") ?? "createdAt";
  const currentSortDir = searchParams.get("sortDir") ?? "desc";
  const current = SORT_OPTIONS.find((o) => o.sortBy === currentSortBy && o.sortDir === currentSortDir) ?? SORT_OPTIONS[0];

  function setSort(sortBy: string, sortDir: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.delete("skip");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="border border-border">
          <ArrowDownUp className="h-3.5 w-3.5" />
          {current.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem key={`${option.sortBy}-${option.sortDir}`} onSelect={() => setSort(option.sortBy, option.sortDir)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
