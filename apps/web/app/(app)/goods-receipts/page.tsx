import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GoodsReceipt {
  id: string;
  receivedAt: string;
  warehouse: { name: string };
}

export default async function GoodsReceiptsPage() {
  const receipts = await apiFetch<GoodsReceipt[]>("/v1/goods-receipts");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Goods Receipts</h1>
        <p className="text-sm text-muted-foreground">
          {receipts.length} receipts — created from a Purchase Order&apos;s &quot;Receive Goods&quot; action.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Warehouse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-10 text-center text-sm text-faint">
                  No goods receipts yet.
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <Link href={`/goods-receipts/${receipt.id}`} className="font-medium text-foreground hover:text-accent">
                      {new Date(receipt.receivedAt).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{receipt.warehouse.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
