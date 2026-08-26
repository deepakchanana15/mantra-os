import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { formatInvoiceAmount, type InvoiceCurrencySource } from "@/lib/invoice-currency";

interface Invoice extends InvoiceCurrencySource {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  discountAmount: string | null;
  gstApplicable: boolean;
  gstRate: string | null;
  exportUnderLut: boolean;
  dueDate: string | null;
  customer: { name: string } | null;
  consigneeCompany: { name: string; legalName: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export default async function InvoicesPage() {
  const invoices = await apiFetch<Invoice[]>("/v1/invoices");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-faint">
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const total = Number(invoice.amount) - Number(invoice.discountAmount ?? 0);
                const gstRatePct = invoice.gstRate != null ? Number(invoice.gstRate) : 10;
                const grandTotal = !invoice.exportUnderLut && invoice.gstApplicable ? Math.round(total * (1 + gstRatePct / 100) * 100) / 100 : total;
                const partyName = invoice.consigneeCompany?.legalName ?? invoice.consigneeCompany?.name ?? invoice.customer?.name ?? "—";
                return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-foreground hover:text-accent">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{partyName}</TableCell>
                  <TableCell className="text-muted-foreground">{STATUS_LABELS[invoice.status] ?? invoice.status}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatInvoiceAmount(grandTotal, invoice)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/invoices/${invoice.id}`} entityLabel="Invoice" />
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
