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
  legalName: string | null;
  baseCurrencyId: string | null;
}

/** A legal entity within the org (Mantra Sports USA LLC, ...). See DECISIONS.md "Global multi-country, multi-company, multi-brand architecture". */
export function CompaniesTab({ companies: initial, currencies }: { companies: Company[]; currencies: Currency[] }) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [baseCurrencyId, setBaseCurrencyId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const currencyCode = (id: string | null) => currencies.find((c) => c.id === id)?.code ?? "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, legalName: legalName || undefined, baseCurrencyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the company.");
        return;
      }
      toast.success("Company created");
      setCompanies((prev) => [...prev, data]);
      setName("");
      setLegalName("");
      setBaseCurrencyId(undefined);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Legal entities operating under this organization (e.g. Mantra Sports USA LLC). Each Country belongs to one Company.
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Legal Name</TableHead>
              <TableHead>Base Currency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-faint">
                  No companies yet.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium text-foreground">{company.name}</TableCell>
                  <TableCell className="text-muted-foreground">{company.legalName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{currencyCode(company.baseCurrencyId)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            Add Company
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name">Name</Label>
              <Input id="company-name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-legal-name">Legal name</Label>
              <Input id="company-legal-name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Base currency</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {baseCurrencyId ? currencyCode(baseCurrencyId) : "Select a currency"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {currencies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setBaseCurrencyId(c.id)}>
                      {c.code}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
