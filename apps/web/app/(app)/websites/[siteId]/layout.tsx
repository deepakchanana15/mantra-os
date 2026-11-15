import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StorefrontSiteSwitcher, type StorefrontSiteOption } from "@/components/domain/storefront-site-switcher";
import { StorefrontSubNav } from "@/components/domain/storefront-sub-nav";

export default async function StorefrontSiteLayout({ children, params }: { children: React.ReactNode; params: { siteId: string } }) {
  const sites = await apiFetch<StorefrontSiteOption[]>("/v1/storefront/sites");

  return (
    <div className="flex flex-col gap-4 p-7">
      <div>
        <Link href="/websites" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Websites
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Manage website</h1>
          <StorefrontSiteSwitcher currentSiteId={params.siteId} sites={sites} section="settings" />
        </div>
      </div>

      <StorefrontSubNav siteId={params.siteId} />

      <div>{children}</div>
    </div>
  );
}
