import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StorefrontProductForm } from "@/components/domain/storefront-product-form";

export default function NewStorefrontProductPage({ params }: { params: { siteId: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href={`/websites/${params.siteId}/products`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Products
      </Link>
      <StorefrontProductForm siteId={params.siteId} />
    </div>
  );
}
