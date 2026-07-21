"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Country {
  id: string;
  name: string;
  isoCode: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Website {
  id: string;
  countryId: string;
  brandId: string;
  domain: string | null;
  enabled: boolean;
}

/** Every website has a Country and a Brand — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture". */
export function WebsitesTab({ websites: initial, countries, brands }: { websites: Website[]; countries: Country[]; brands: Brand[] }) {
  const router = useRouter();
  const [websites, setWebsites] = useState(initial);
  const [open, setOpen] = useState(false);
  const [countryId, setCountryId] = useState<string | undefined>(countries[0]?.id);
  const [brandId, setBrandId] = useState<string | undefined>(brands[0]?.id);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const countryLabel = (id: string) => {
    const c = countries.find((c) => c.id === id);
    return c ? `${c.name} (${c.isoCode})` : "—";
  };
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!countryId || !brandId) {
      toast.error("Select a country and a brand first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryId, brandId, domain: domain || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the website.");
        return;
      }
      toast.success("Website created");
      setWebsites((prev) => [...prev, data]);
      setDomain("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Each storefront/website belongs to one Country and one Brand.</p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {websites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-faint">
                  No websites yet.
                </TableCell>
              </TableRow>
            ) : (
              websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium text-foreground">{website.domain ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{countryLabel(website.countryId)}</TableCell>
                  <TableCell className="text-muted-foreground">{brandName(website.brandId)}</TableCell>
                  <TableCell className="text-muted-foreground">{website.enabled ? "Enabled" : "Disabled"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit" disabled={countries.length === 0 || brands.length === 0}>
            Add Website
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New website</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Country</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {countryId ? countryLabel(countryId) : "Select a country"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {countries.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCountryId(c.id)}>
                      {countryLabel(c.id)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Brand</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {brandId ? brandName(brandId) : "Select a brand"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {brands.map((b) => (
                    <DropdownMenuItem key={b.id} onSelect={() => setBrandId(b.id)}>
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website-domain">Domain</Label>
              <Input id="website-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mantrasports.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create website"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
