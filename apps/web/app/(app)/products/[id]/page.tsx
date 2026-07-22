import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: string;
  unitCost: string | null;
  category: { name: string } | null;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await apiFetch<Product>(`/v1/products/${params.id}`);
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Products
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">{product.name}</h1>
          <p className="font-mono text-xs text-faint">{product.sku}</p>
        </div>
        <DeleteEntityButton apiPath={`/api/v1/products/${product.id}`} entityLabel="Product" redirectTo="/products" />
      </div>

      <Card className="max-w-lg">
        <CardContent className="flex flex-col gap-3 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="text-foreground">{product.category?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit price</span>
            <span className="tabular-nums text-foreground">{currency.format(Number(product.unitPrice))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit cost</span>
            <span className="tabular-nums text-foreground">
              {product.unitCost ? currency.format(Number(product.unitCost)) : "—"}
            </span>
          </div>
          {product.description && (
            <div className="border-t border-border pt-3 text-muted-foreground">{product.description}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
