"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Brand {
  id: string;
  name: string;
}

/** Optional Brand scoping — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase B. */
export function BrandSelect({
  brandId,
  onChange,
}: {
  brandId: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch("/api/v1/brands").then((res) => (res.ok ? res.json() : [])).then(setBrands).catch(() => setBrands([]));
  }, []);

  const selectedBrand = brands.find((b) => b.id === brandId);

  if (brands.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Brand</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start">
            {selectedBrand?.name ?? "No brand"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
          <DropdownMenuItem onSelect={() => onChange(undefined)}>No brand</DropdownMenuItem>
          {brands.map((b) => (
            <DropdownMenuItem key={b.id} onSelect={() => onChange(b.id)}>
              {b.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
