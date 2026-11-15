import { StorefrontCollectionsManager } from "@/components/domain/storefront-collections-manager";

export default function StorefrontCollectionsPage({ params }: { params: { siteId: string } }) {
  return <StorefrontCollectionsManager siteId={params.siteId} />;
}
