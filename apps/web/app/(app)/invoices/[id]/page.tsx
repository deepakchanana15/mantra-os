import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttachmentLink } from "@/components/domain/attachment-link";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { MarkInvoicePaidButton } from "@/components/domain/mark-invoice-paid-button";
import { invoiceCurrencyCode, type InvoiceCurrencySource } from "@/lib/invoice-currency";

interface Invoice extends InvoiceCurrencySource {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  discountAmount: string | null;
  gstApplicable: boolean;
  gstRate: string | null;
  exportUnderLut: boolean;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  paymentProof: { id: string; fileUrl: string; fileName: string }[];
  customer: { name: string } | null;
  consigneeCompany: { id: string; name: string; legalName: string | null } | null;
  purchaseOrder: { id: string; poNumber: string | null } | null;
  salesOrder: { id: string } | null;
  lines: { id: string; quantity: number; unitPrice: string; product: { name: string; sku: string } }[];
}

const CLOSED_STATUSES = new Set(["PAID", "VOID"]);

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
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoiceCurrencyCode(invoice),
    currencyDisplay: "code",
  });
  const subtotal = Number(invoice.amount);
  const discount = Number(invoice.discountAmount ?? 0);
  const total = subtotal - discount;
  const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
  const gstRatePct = invoice.gstRate != null ? Number(invoice.gstRate) : 10;
  const gst = !invoice.exportUnderLut && invoice.gstApplicable ? Math.round(total * (gstRatePct / 100) * 100) / 100 : 0;
  const grandTotal = total + gst;
  const gstLabel = invoice.gstRate != null ? "IGST" : "GST";
  const partyName = invoice.consigneeCompany?.legalName ?? invoice.consigneeCompany?.name ?? invoice.customer?.name ?? "—";

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
            {invoice.consigneeCompany && (
              <Badge variant="neutral" className="text-[10px]">
                B2B · Export
              </Badge>
            )}
          </div>
          <p className="text-xs text-faint">
            {partyName}
            {invoice.dueDate && ` — due ${new Date(invoice.dueDate).toLocaleDateString()}`}
          </p>
          {invoice.salesOrder && (
            <Link href={`/sales-orders/${invoice.salesOrder.id}`} className="mt-1 block text-xs text-accent hover:underline">
              View linked sales order
            </Link>
          )}
          {invoice.purchaseOrder && (
            <Link href={`/purchase-orders/${invoice.purchaseOrder.id}`} className="mt-1 block text-xs text-accent hover:underline">
              View linked purchase order {invoice.purchaseOrder.poNumber ? `(${invoice.purchaseOrder.poNumber})` : ""}
            </Link>
          )}
          {invoice.status === "PAID" && invoice.paidAt && (
            <p className="mt-1 text-xs text-muted-foreground">Paid on {new Date(invoice.paidAt).toLocaleDateString()}</p>
          )}
          {invoice.paymentProof.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5">
              {invoice.paymentProof.map((proof) => (
                <AttachmentLink
                  key={proof.id}
                  url={proof.fileUrl}
                  fileName={proof.fileName}
                  className="flex w-fit items-center gap-1 text-xs text-accent hover:underline"
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/v1/invoices/${invoice.id}/pdf`} download>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </a>
          {!CLOSED_STATUSES.has(invoice.status) && <MarkInvoicePaidButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />}
          <DeleteEntityButton apiPath={`/api/v1/invoices/${invoice.id}`} entityLabel="Invoice" redirectTo="/invoices" />
        </div>
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
              {discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{currency.format(subtotal)}</TableCell>
                </TableRow>
              )}
              {discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    Discount ({discountPercent.toFixed(2)}%)
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">-{currency.format(discount)}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} className={`text-right ${invoice.gstApplicable || invoice.exportUnderLut ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                  Total
                </TableCell>
                <TableCell className={`text-right tabular-nums ${invoice.gstApplicable || invoice.exportUnderLut ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                  {currency.format(total)}
                </TableCell>
              </TableRow>
              {invoice.exportUnderLut && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right text-xs text-muted-foreground">
                    Supply meant for export under LUT without payment of Integrated Tax
                  </TableCell>
                </TableRow>
              )}
              {!invoice.exportUnderLut && invoice.gstApplicable && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    {gstLabel} ({gstRatePct}%)
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{currency.format(gst)}</TableCell>
                </TableRow>
              )}
              {(invoice.gstApplicable || invoice.exportUnderLut) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold text-foreground">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-foreground">{currency.format(grandTotal)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            {discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{currency.format(subtotal)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount ({discountPercent.toFixed(2)}%)</span>
                <span className="tabular-nums">-{currency.format(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className={invoice.gstApplicable || invoice.exportUnderLut ? "text-muted-foreground" : "font-semibold text-foreground"}>Total</span>
              <span className={`tabular-nums ${invoice.gstApplicable || invoice.exportUnderLut ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                {currency.format(total)}
              </span>
            </div>
            {invoice.exportUnderLut && (
              <p className="text-right text-xs text-muted-foreground">Supply meant for export under LUT without payment of Integrated Tax</p>
            )}
            {!invoice.exportUnderLut && invoice.gstApplicable && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{gstLabel} ({gstRatePct}%)</span>
                <span className="tabular-nums">{currency.format(gst)}</span>
              </div>
            )}
            {(invoice.gstApplicable || invoice.exportUnderLut) && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Grand Total</span>
                <span className="font-semibold tabular-nums text-foreground">{currency.format(grandTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
