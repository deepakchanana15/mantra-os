import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/domain/search-input";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  price: string | null;
  currency: string;
  stockStatus: string;
  category: { name: string } | null;
}

interface ProductsPage {
  data: Product[];
  total: number;
}

const PAGE_SIZE = 50;

export default async function StorefrontProductsPage({
  params,
  searchParams,
}: {
  params: { siteId: string };
  searchParams: { skip?: string; search?: string };
}) {
  const skip = Math.max(0, Number(searchParams.skip) || 0);
  const search = searchParams.search ?? "";
  const qs = `skip=${skip}&take=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const page = await apiFetch<ProductsPage>(`/v1/storefront/sites/${params.siteId}/products?${qs}`);
  const { data: products, total } = page;

  const rangeStart = total === 0 ? 0 : skip + 1;
  const rangeEnd = Math.min(skip + products.length, total);
  const hasPrev = skip > 0;
  const hasNext = skip + products.length < total;
  const pageLink = (newSkip: number) => `/websites/${params.siteId}/products?skip=${newSkip}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} products</p>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search products…" />
          <Link href={`/websites/${params.siteId}/products/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              New product
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-faint">
                  {search ? "No products match your search." : "No products yet."}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link href={`/websites/${params.siteId}/products/${product.id}`} className="font-medium text-foreground hover:text-accent">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-faint">{product.sku ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === "ACTIVE" ? "success" : "neutral"}>{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.stockStatus}</TableCell>
                  <TableCell className="text-muted-foreground">{product.price ? `${product.currency} ${product.price}` : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={pageLink(Math.max(0, skip - PAGE_SIZE))}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
            )}
            {hasNext ? (
              <Link href={pageLink(skip + PAGE_SIZE)}>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
