import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { StatusUpdater } from "./status-updater";

interface Quote {
  id: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  customer: { name: string };
  lines: { id: string; quantity: number; unitPrice: string; product: { name: string; sku: string } }[];
}

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = await apiFetch<Quote>(`/v1/quotes/${params.id}`);
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const total = quote.lines.reduce((sum, l) => sum + l.quantity * Number(l.unitPrice), 0);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/quotes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quotes
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">Quote for {quote.customer.name}</h1>
          <p className="text-xs text-faint">Created {new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <StatusUpdater apiPath={`/api/v1/quotes/${quote.id}/status`} statuses={STATUSES} currentStatus={quote.status} />
          <DeleteEntityButton apiPath={`/api/v1/quotes/${quote.id}`} entityLabel="Quote" redirectTo="/quotes" />
        </div>
      </div>

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
            {quote.lines.map((line) => (
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
                {currency.format(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
