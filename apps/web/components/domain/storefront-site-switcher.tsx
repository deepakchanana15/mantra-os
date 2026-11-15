"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StorefrontSiteOption {
  id: string;
  name: string;
  code: string;
}

/** Same DropdownMenu-as-combobox pattern as the org switcher — this app has
 * no Select primitive, every "switcher" is built this way. */
export function StorefrontSiteSwitcher({ currentSiteId, sites, section }: { currentSiteId: string; sites: StorefrontSiteOption[]; section: string }) {
  const router = useRouter();
  const current = sites.find((s) => s.id === currentSiteId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-tint text-[10px] font-bold text-accent-hover">
              {(current?.code ?? "??").slice(0, 2)}
            </span>
            <span className="truncate text-sm font-medium">{current?.name ?? "Select a site"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Sites</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sites.map((site) => (
          <DropdownMenuItem key={site.id} onSelect={() => router.push(`/websites/${site.id}/${section}`)}>
            <span className="flex h-5 w-5 items-center justify-center rounded bg-surface text-[10px] font-bold text-muted-foreground">
              {site.code.slice(0, 2)}
            </span>
            <span className="ml-2 truncate">{site.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
