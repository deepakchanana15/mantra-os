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
import { CompanyCountrySelect } from "@/components/domain/company-country-select";

interface Customer {
  id: string;
  name: string;
}

interface SalesOrder {
  id: string;
  orderDate: string;
  customer: { name: string };
}

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

function defaultInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [salesOrderId, setSalesOrderId] = useState<string | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [status, setStatus] = useState("DRAFT");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers").then((res) => (res.ok ? res.json() : [])).then(setCustomers);
    fetch("/api/v1/sales-orders").then((res) => (res.ok ? res.json() : [])).then(setSalesOrders);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSalesOrder = salesOrders.find((o) => o.id === salesOrderId);
  const selectedStatus = STATUSES.find((s) => s.value === status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          salesOrderId,
          invoiceNumber,
          status,
          amount: Number(amount),
          dueDate: dueDate || undefined,
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the invoice.");
        return;
      }
      toast.success("Invoice created");
      router.push("/invoices");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/invoices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Invoices
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Invoice</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoiceNumber">Invoice number</Label>
              <Input
                id="invoiceNumber"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCustomer?.name ?? "Select a customer"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {customers.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Sales order</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedSalesOrder
                      ? `${selectedSalesOrder.customer.name} — ${new Date(selectedSalesOrder.orderDate).toLocaleDateString()}`
                      : "No sales order"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  <DropdownMenuItem onSelect={() => setSalesOrderId(undefined)}>No sales order</DropdownMenuItem>
                  {salesOrders.map((o) => (
                    <DropdownMenuItem key={o.id} onSelect={() => setSalesOrderId(o.id)}>
                      {o.customer.name} — {new Date(o.orderDate).toLocaleDateString()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedStatus?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {STATUSES.map((s) => (
                    <DropdownMenuItem key={s.value} onSelect={() => setStatus(s.value)}>
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !customerId}>
                {loading ? "Creating…" : "Create invoice"}
              </Button>
              <Link href="/invoices">
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
