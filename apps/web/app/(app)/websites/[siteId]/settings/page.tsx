import { StorefrontSettingsForm } from "@/components/domain/storefront-settings-form";

export default function StorefrontSettingsPage({ params }: { params: { siteId: string } }) {
  return <StorefrontSettingsForm siteId={params.siteId} />;
}
