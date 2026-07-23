import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  issuedAt: string | null;
  dueDate: string | null;
  customer: { name: string };
  salesOrder: { id: string } | null;
  lines: { id: string; quantity: number; unitPrice: string; product: { name: string; sku: string } }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  DRAFT: "neutral",
  SENT: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  VOID: "destructive",
};

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await apiFetch<Invoice>(`/v1/invoices/${params.id}`);
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/invoices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Invoices
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
            <Badge variant={STATUS_VARIANT[invoice.status] ?? "neutral"}>{STATUS_LABELS[invoice.status] ?? invoice.status}</Badge>
          </div>
          <p className="text-xs text-faint">
            {invoice.customer.name}
            {invoice.dueDate && ` — due ${new Date(invoice.dueDate).toLocaleDateString()}`}
          </p>
          {invoice.salesOrder && (
            <Link href={`/sales-orders/${invoice.salesOrder.id}`} className="mt-1 block text-xs text-accent hover:underline">
              View linked sales order
            </Link>
          )}
        </div>
        <DeleteEntityButton apiPath={`/api/v1/invoices/${invoice.id}`} entityLabel="Invoice" redirectTo="/invoices" />
      </div>

      {invoice.lines.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{line.product.name}</div>
                    <div className="font-mono text-xs text-faint">{line.product.sku}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{currency.format(Number(line.unitPrice))}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currency.format(line.quantity * Number(line.unitPrice))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold text-foreground">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-foreground">
                  {currency.format(Number(invoice.amount))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold tabular-nums text-foreground">{currency.format(Number(invoice.amount))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
