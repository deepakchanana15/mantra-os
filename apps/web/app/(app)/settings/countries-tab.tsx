"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Currency {
  id: string;
  code: string;
}

interface Company {
  id: string;
  name: string;
}

interface Country {
  id: string;
  companyId: string;
  name: string;
  isoCode: string;
  currencyId: string | null;
  taxPercentage: string | null;
  enabled: boolean;
}

/** Belongs to a Company — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture". */
export function CountriesTab({
  countries: initial,
  companies,
  currencies,
}: {
  countries: Country[];
  companies: Company[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [countries, setCountries] = useState(initial);
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | undefined>(companies[0]?.id);
  const [name, setName] = useState("");
  const [isoCode, setIsoCode] = useState("");
  const [currencyId, setCurrencyId] = useState<string | undefined>(undefined);
  const [taxPercentage, setTaxPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "—";
  const currencyCode = (id: string | null) => currencies.find((c) => c.id === id)?.code ?? "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) {
      toast.error("Select a company first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          name,
          isoCode: isoCode.toUpperCase(),
          currencyId,
          taxPercentage: taxPercentage ? Number(taxPercentage) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the country.");
        return;
      }
      toast.success("Country created");
      setCountries((prev) => [...prev, data]);
      setName("");
      setIsoCode("");
      setCurrencyId(undefined);
      setTaxPercentage("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Countries this business operates in, each under a Company. Tax percentage is a simple flat rate for now — see
        the project docs for the full tax-engine plan.
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>ISO</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Tax %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-faint">
                  No countries yet.
                </TableCell>
              </TableRow>
            ) : (
              countries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium text-foreground">{country.name}</TableCell>
                  <TableCell className="text-muted-foreground">{country.isoCode}</TableCell>
                  <TableCell className="text-muted-foreground">{companyName(country.companyId)}</TableCell>
                  <TableCell className="text-muted-foreground">{currencyCode(country.currencyId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {country.taxPercentage ? `${country.taxPercentage}%` : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit" disabled={companies.length === 0}>
            Add Country
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New country</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Company</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {companyId ? companyName(companyId) : "Select a company"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {companies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCompanyId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country-name">Country name</Label>
              <Input id="country-name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country-iso">ISO code</Label>
              <Input id="country-iso" required maxLength={3} value={isoCode} onChange={(e) => setIsoCode(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {currencyId ? currencyCode(currencyId) : "Select a currency"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {currencies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCurrencyId(c.id)}>
                      {c.code}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country-tax">Tax percentage</Label>
              <Input
                id="country-tax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create country"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
