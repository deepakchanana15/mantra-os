import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StorefrontProductForm, type StorefrontProductInitial } from "@/components/domain/storefront-product-form";
import { StorefrontProductVariants, type ProductVariant } from "@/components/domain/storefront-product-variants";
import { StorefrontProductImages, type ProductImage } from "@/components/domain/storefront-product-images";

interface Product extends StorefrontProductInitial {
  variants: ProductVariant[];
  images: ProductImage[];
}

export default async function StorefrontProductDetailPage({ params }: { params: { siteId: string; productId: string } }) {
  const product = await apiFetch<Product>(`/v1/storefront/sites/${params.siteId}/products/${params.productId}`);

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/websites/${params.siteId}/products`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Products
      </Link>
      <StorefrontProductForm siteId={params.siteId} initial={product} />
      <StorefrontProductVariants siteId={params.siteId} productId={product.id!} variants={product.variants} />
      <StorefrontProductImages siteId={params.siteId} productId={product.id!} images={product.images} />
    </div>
  );
}
