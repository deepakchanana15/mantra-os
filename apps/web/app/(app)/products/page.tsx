import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/domain/search-input";
import { ExportCsvButton } from "@/components/domain/export-csv-button";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { formatProductPrice, type ProductCurrencySource } from "@/lib/product-currency";

interface Product extends ProductCurrencySource {
  id: string;
  sku: string;
  name: string;
  unitPrice: string;
  category: { name: string } | null;
}

export default async function ProductsPage({ searchParams }: { searchParams: { search?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.search) params.set("search", searchParams.search);
  const products = await apiFetch<Product[]>(`/v1/products?${params.toString()}`);
  const exportRows = products.map((p) => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.category?.name ?? "",
    "Unit Price": p.unitPrice,
  }));

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput placeholder="Search products..." />
        <div className="ml-auto">
          <ExportCsvButton
            rows={exportRows}
            filenamePrefix="products"
            columns={["SKU", "Name", "Category", "Unit Price"]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Link href={`/products/${product.id}`} className="font-medium text-foreground hover:text-accent">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatProductPrice(product.unitPrice, product)}</TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/products/${product.id}`} entityLabel="Product" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
