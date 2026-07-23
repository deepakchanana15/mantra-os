import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GoodsReceipt {
  id: string;
  receivedAt: string;
  warehouse: { name: string };
  purchaseOrder: { id: string; supplier: { name: string } };
  lines: { id: string; quantity: number; purchaseOrderLine: { product: { name: string; sku: string } } }[];
  attachments: { id: string; fileUrl: string; fileName: string }[];
}

/** No delete button — goods receipts are append-only, see DATABASE.md "Append-only ledger tables". */
export default async function GoodsReceiptDetailPage({ params }: { params: { id: string } }) {
  const receipt = await apiFetch<GoodsReceipt>(`/v1/goods-receipts/${params.id}`);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/goods-receipts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Goods Receipts
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">Receipt from {receipt.purchaseOrder.supplier.name}</h1>
        <p className="text-xs text-faint">
          Received {new Date(receipt.receivedAt).toLocaleString()} at {receipt.warehouse.name}
        </p>
        {receipt.attachments.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {receipt.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipt.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{line.purchaseOrderLine.product.name}</div>
                  <div className="font-mono text-xs text-faint">{line.purchaseOrderLine.product.sku}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
