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

interface Company {
  id: string;
  name: string;
}

interface Country {
  id: string;
  companyId: string;
  name: string;
  isoCode: string;
}

/**
 * Optional Company/Country scoping for records — see DECISIONS.md "Global
 * multi-country, multi-company, multi-brand architecture" Sub-phase B.
 * Country choices are filtered to the selected Company; picking a different
 * Company clears an incompatible Country selection.
 */
export function CompanyCountrySelect({
  companyId,
  countryId,
  onCompanyChange,
  onCountryChange,
}: {
  companyId: string | undefined;
  countryId: string | undefined;
  onCompanyChange: (id: string | undefined) => void;
  onCountryChange: (id: string | undefined) => void;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("/api/v1/companies").then((res) => (res.ok ? res.json() : [])).then(setCompanies).catch(() => setCompanies([]));
    fetch("/api/v1/countries").then((res) => (res.ok ? res.json() : [])).then(setCountries).catch(() => setCountries([]));
  }, []);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const availableCountries = companyId ? countries.filter((c) => c.companyId === companyId) : countries;
  const selectedCountry = countries.find((c) => c.id === countryId);

  if (companies.length === 0 && countries.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Company</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-start">
              {selectedCompany?.name ?? "No company"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
            <DropdownMenuItem
              onSelect={() => {
                onCompanyChange(undefined);
                if (countryId && countries.find((c) => c.id === countryId)?.companyId !== undefined) {
                  onCountryChange(undefined);
                }
              }}
            >
              No company
            </DropdownMenuItem>
            {companies.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onSelect={() => {
                  onCompanyChange(c.id);
                  if (countryId && countries.find((co) => co.id === countryId)?.companyId !== c.id) {
                    onCountryChange(undefined);
                  }
                }}
              >
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Country</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-start">
              {selectedCountry?.name ?? "No country"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
            <DropdownMenuItem onSelect={() => onCountryChange(undefined)}>No country</DropdownMenuItem>
            {availableCountries.map((c) => (
              <DropdownMenuItem key={c.id} onSelect={() => onCountryChange(c.id)}>
                {c.name} ({c.isoCode})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
