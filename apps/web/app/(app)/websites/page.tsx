import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStorefrontSiteButton } from "@/components/domain/add-storefront-site-button";

interface StorefrontSite {
  id: string;
  name: string;
  code: string;
  domain: string | null;
  locale: string | null;
  status: "ACTIVE" | "COMING_SOON";
}

export default async function WebsitesPage() {
  const sites = await apiFetch<StorefrontSite[]>("/v1/storefront/sites");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Websites</h1>
          <p className="text-sm text-muted-foreground">{sites.length} registered sites</p>
        </div>
        <AddStorefrontSiteButton />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Locale</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                  No websites registered yet.
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <Link href={`/websites/${site.id}/settings`} className="font-medium text-foreground hover:text-accent">
                      {site.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-faint">{site.code}</TableCell>
                  <TableCell className="text-muted-foreground">{site.domain ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{site.locale ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={site.status === "ACTIVE" ? "success" : "neutral"}>
                      {site.status === "ACTIVE" ? "Active" : "Coming soon"}
                    </Badge>
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
