import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdjustStockDialog } from "./adjust-stock-dialog";

interface StockLevel {
  id: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number | null;
  product: { name: string; sku: string };
  warehouse: { name: string };
}

interface InventoryTransaction {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
  product: { name: string; sku: string };
  warehouse: { name: string };
}

export default async function InventoryPage() {
  const [stockLevels, transactions] = await Promise.all([
    apiFetch<StockLevel[]>("/v1/inventory/stock"),
    apiFetch<InventoryTransaction[]>("/v1/inventory/transactions"),
  ]);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Stock levels and the movement ledger behind them.</p>
        </div>
        <AdjustStockDialog />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                      No stock recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  stockLevels.map((level) => {
                    const low = level.reorderPoint !== null && level.quantityOnHand <= level.reorderPoint;
                    return (
                      <TableRow key={level.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{level.product.name}</div>
                          <div className="font-mono text-xs text-faint">{level.product.sku}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{level.warehouse.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{level.quantityOnHand}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {level.quantityReserved}
                        </TableCell>
                        <TableCell>
                          {low ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">OK</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{txn.type}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{txn.product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{txn.warehouse.name}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${txn.quantity < 0 ? "text-destructive" : "text-success"}`}
                      >
                        {txn.quantity > 0 ? `+${txn.quantity}` : txn.quantity}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
