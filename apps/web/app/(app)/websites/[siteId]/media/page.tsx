import { StorefrontMediaManager } from "@/components/domain/storefront-media-manager";

export default function StorefrontMediaPage({ params }: { params: { siteId: string } }) {
  return <StorefrontMediaManager siteId={params.siteId} />;
}
