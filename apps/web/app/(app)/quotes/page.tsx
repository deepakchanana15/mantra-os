import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Quote {
  id: string;
  status: string;
  createdAt: string;
  customer: { name: string };
  lines: { quantity: number; unitPrice: string }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "destructive",
};

export default async function QuotesPage() {
  const quotes = await apiFetch<Quote[]>("/v1/quotes");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground">{quotes.length} quotes</p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-faint">
                  No quotes yet.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => {
                const total = quote.lines.reduce((sum, l) => sum + l.quantity * Number(l.unitPrice), 0);
                return (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link href={`/quotes/${quote.id}`} className="font-medium text-foreground hover:text-accent">
                        {quote.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[quote.status] ?? "neutral"}>{quote.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency.format(total)}</TableCell>
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
