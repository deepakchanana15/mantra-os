"use client";

import { useState } from "react";
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

export interface OrgSwitcherOrg {
  id: string;
  name: string;
}

export function OrgSwitcher({ currentOrg, organizations }: { currentOrg: OrgSwitcherOrg; organizations: OrgSwitcherOrg[] }) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function switchTo(organizationId: string) {
    if (organizationId === currentOrg.id) return;
    setSwitching(true);
    try {
      await fetch("/api/org/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      // Full reload, not a client transition — every piece of org-scoped
      // state on screen must be re-fetched under the new tenant context,
      // never carried over. See ARCHITECTURE.md "Org switching".
      window.location.href = "/dashboard";
    } finally {
      setSwitching(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="justify-between px-2" disabled={switching}>
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">
              {currentOrg.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="truncate text-sm font-semibold">{currentOrg.name}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => switchTo(org.id)}>
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-tint text-[10px] font-bold text-accent-hover">
              {org.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="ml-2 truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
