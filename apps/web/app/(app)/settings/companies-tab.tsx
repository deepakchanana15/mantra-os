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
  registrationNumber: string | null;
  baseCurrencyId: string | null;
}

interface CompanyFormState {
  name: string;
  legalName: string;
  registrationNumber: string;
  baseCurrencyId: string | undefined;
}

const EMPTY_FORM: CompanyFormState = { name: "", legalName: "", registrationNumber: "", baseCurrencyId: undefined };

/** A legal entity within the org (Mantra Sports USA LLC, ...). See DECISIONS.md "Global multi-country, multi-company, multi-brand architecture". */
export function CompaniesTab({ companies: initial, currencies }: { companies: Company[]; currencies: Currency[] }) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const currencyCode = (id: string | null) => currencies.find((c) => c.id === id)?.code ?? "—";

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(company: Company) {
    setEditingId(company.id);
    setForm({
      name: company.name,
      legalName: company.legalName ?? "",
      registrationNumber: company.registrationNumber ?? "",
      baseCurrencyId: company.baseCurrencyId ?? undefined,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = JSON.stringify({
        name: form.name,
        legalName: form.legalName || undefined,
        registrationNumber: form.registrationNumber || undefined,
        baseCurrencyId: form.baseCurrencyId,
      });
      const res = await fetch(editingId ? `/api/v1/companies/${editingId}` : "/api/v1/companies", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? `Couldn't ${editingId ? "update" : "create"} the company.`);
        return;
      }
      toast.success(editingId ? "Company updated" : "Company created");
      setCompanies((prev) => (editingId ? prev.map((c) => (c.id === editingId ? data : c)) : [...prev, data]));
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
              <TableHead>Registration No.</TableHead>
              <TableHead>Base Currency</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-faint">
                  No companies yet.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium text-foreground">{company.name}</TableCell>
                  <TableCell className="text-muted-foreground">{company.legalName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{company.registrationNumber ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{currencyCode(company.baseCurrencyId)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(company)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit" onClick={openCreate}>
            Add Company
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit company" : "New company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name">Name</Label>
              <Input
                id="company-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-legal-name">Legal name</Label>
              <Input
                id="company-legal-name"
                value={form.legalName}
                onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-registration-number">Registration number</Label>
              <Input
                id="company-registration-number"
                placeholder="e.g. ACN, EIN, company registration number"
                value={form.registrationNumber}
                onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Base currency</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {form.baseCurrencyId ? currencyCode(form.baseCurrencyId) : "Select a currency"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {currencies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setForm((f) => ({ ...f, baseCurrencyId: c.id }))}>
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
                {loading ? "Saving…" : editingId ? "Save changes" : "Create company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
