import { StorefrontCategoriesManager } from "@/components/domain/storefront-categories-manager";

export default function StorefrontCategoriesPage({ params }: { params: { siteId: string } }) {
  return <StorefrontCategoriesManager siteId={params.siteId} />;
}
