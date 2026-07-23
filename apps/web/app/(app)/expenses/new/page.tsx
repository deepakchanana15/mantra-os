"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiFileUpload, type UploadedAttachment } from "@/components/domain/multi-file-upload";
import { CompanyCountrySelect } from "@/components/domain/company-country-select";

interface Supplier {
  id: string;
  name: string;
}

const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARIES", label: "Salaries" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OFFICE_SUPPLIES", label: "Office supplies" },
  { value: "PROFESSIONAL_SERVICES", label: "Professional services" },
  { value: "GOODS_RECEIPT", label: "Goods receipt" },
  { value: "OTHER", label: "Other" },
];

export default function NewExpensePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/suppliers").then((res) => (res.ok ? res.json() : [])).then(setSuppliers);
  }, []);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedCategory = EXPENSE_CATEGORIES.find((c) => c.value === category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorName || !amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName,
          category,
          amount: Number(amount),
          expenseDate: expenseDate || undefined,
          notes: notes || undefined,
          attachments,
          supplierId,
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the expense.");
        return;
      }
      toast.success("Expense created");
      router.push("/expenses");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/expenses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Expenses
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Expense</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendorName">Vendor</Label>
              <Input
                id="vendorName"
                required
                placeholder="e.g. Petty cash, Parking, Courier, or a supplier name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Supplier (optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedSupplier?.name ?? "No supplier"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  <DropdownMenuItem onSelect={() => setSupplierId(undefined)}>No supplier</DropdownMenuItem>
                  {suppliers.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onSelect={() => {
                        setSupplierId(s.id);
                        if (!vendorName) setVendorName(s.name);
                      }}
                    >
                      {s.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Leave as "No supplier" for petty cash, parking, courier, or other expenses with no supplier record.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {selectedCategory?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <DropdownMenuItem key={c.value} onSelect={() => setCategory(c.value)}>
                        {c.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expenseDate">Date</Label>
              <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <MultiFileUpload label="Receipts / invoices (optional)" attachments={attachments} onChange={setAttachments} />

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !vendorName || !amount}>
                {loading ? "Creating…" : "Create expense"}
              </Button>
              <Link href="/expenses">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
