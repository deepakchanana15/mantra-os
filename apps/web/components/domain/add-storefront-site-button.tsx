"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/**
 * Registers a site's connection details (its own database + Cloudinary
 * account) — these are read back by MantraOS only server-side, never shown
 * again in this UI once saved (see StorefrontSitesRepository's SELECT).
 */
export function AddStorefrontSiteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [locale, setLocale] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");

  function reset() {
    setName("");
    setCode("");
    setDomain("");
    setLocale("");
    setCurrencyCode("");
    setDatabaseUrl("");
    setCloudinaryCloudName("");
    setCloudinaryApiKey("");
    setCloudinaryApiSecret("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code || !databaseUrl) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/storefront/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          domain: domain || undefined,
          locale: locale || undefined,
          currencyCode: currencyCode || undefined,
          databaseUrl,
          cloudinaryCloudName: cloudinaryCloudName || undefined,
          cloudinaryApiKey: cloudinaryApiKey || undefined,
          cloudinaryApiSecret: cloudinaryApiSecret || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't register this site.");
        return;
      }
      toast.success("Site registered");
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register a website</DialogTitle>
          <DialogDescription>
            Connects MantraOS directly to this site&apos;s own database and Cloudinary account. These
            credentials are never shown again after saving.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="siteName">Name</Label>
              <Input id="siteName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mantra Sports Canada" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="siteCode">Code</Label>
              <Input id="siteCode" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CA" maxLength={10} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="siteDomain">Domain</Label>
              <Input id="siteDomain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mantrasports.ca" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="siteLocale">Locale</Label>
              <Input id="siteLocale" value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en-CA" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="siteCurrency">Currency</Label>
              <Input id="siteCurrency" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} placeholder="CAD" maxLength={3} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="databaseUrl">Database connection string</Label>
            <Input
              id="databaseUrl"
              required
              type="password"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              placeholder="postgresql://…"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cloudName">Cloudinary cloud name</Label>
              <Input id="cloudName" value={cloudinaryCloudName} onChange={(e) => setCloudinaryCloudName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cloudKey">Cloudinary API key</Label>
              <Input id="cloudKey" value={cloudinaryApiKey} onChange={(e) => setCloudinaryApiKey(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cloudSecret">Cloudinary API secret</Label>
              <Input id="cloudSecret" type="password" value={cloudinaryApiSecret} onChange={(e) => setCloudinaryApiSecret(e.target.value)} />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !code || !databaseUrl}>
              {loading ? "Registering…" : "Register site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
