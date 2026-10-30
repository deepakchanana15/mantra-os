"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
}

interface MetaLeadPage {
  id: string;
  pageId: string;
  label: string;
  enabled: boolean;
  company: { name: string } | null;
  createdAt: string;
}

/**
 * Connects a Facebook Page running Lead Ads so new form submissions become
 * Opportunities automatically — same shape as WhatsAppTab. The webhook
 * URL/verify token are the values Meta's webhook subscription setup needs;
 * the App Secret (signature verification) is a server-side env var, never
 * shown here. Unlike WhatsApp, the Page Access Token pasted into the
 * "Connect a Page" form IS a credential this feature needs to call back to
 * Meta with (to fetch each lead's actual answers) — stored, but never
 * returned by the API once saved.
 */
export function MetaLeadsTab({
  pages: initial,
  companies,
  webhookUrl,
}: {
  pages: MetaLeadPage[];
  companies: Company[];
  webhookUrl: string;
}) {
  const [pages, setPages] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [label, setLabel] = useState("");
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/meta-lead-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, pageAccessToken, label, companyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't connect this Page.");
        return;
      }
      toast.success("Facebook Page connected — new leads will become Opportunities");
      setPages((prev) => [data, ...prev]);
      setPageId("");
      setPageAccessToken("");
      setLabel("");
      setCompanyId(undefined);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/meta-lead-pages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error?.message ?? "Couldn't disconnect this Page.");
      return;
    }
    toast.success("Page disconnected — new leads from it will no longer create Opportunities");
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">Webhook setup (Meta Developer App → Webhooks → Page → leadgen)</p>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-faint">Callback URL</span>
          <button
            type="button"
            onClick={() => copy(webhookUrl)}
            className="w-fit rounded bg-surface-secondary px-2 py-1 text-left font-mono text-xs text-muted-foreground hover:text-accent"
          >
            {webhookUrl}
          </button>
        </div>
        <p className="text-xs text-faint">
          The verify token and app secret are configured on the server — ask whoever set up MantraOS for those
          values if Meta's webhook setup asks for them. After subscribing the webhook, also subscribe the app to the
          Page itself (Page Settings → Advanced Messaging, or <code className="font-mono">POST /&#123;page-id&#125;/subscribed_apps</code>
          {" "}with <code className="font-mono">subscribed_fields=leadgen</code>).
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Connect a Facebook Page running Lead Ads so new form submissions become Opportunities automatically. Find
        the Page ID in the Page&apos;s About section, and generate a Page Access Token with the{" "}
        <code className="font-mono">leads_retrieval</code> and <code className="font-mono">pages_read_engagement</code>{" "}
        permissions via Graph API Explorer or a System User in Business Settings.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            Connect a Page
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Facebook Page</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="page-id">Page ID</Label>
              <Input
                id="page-id"
                required
                placeholder="From the Page's About section"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="page-access-token">Page access token</Label>
              <Input
                id="page-access-token"
                required
                type="password"
                placeholder="With leads_retrieval permission"
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meta-lead-label">Label</Label>
              <Input
                id="meta-lead-label"
                required
                placeholder="e.g. Mantra Sports Australia"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Company (optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCompanyName ?? "No company"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  <DropdownMenuItem onSelect={() => setCompanyId(undefined)}>No company</DropdownMenuItem>
                  {companies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCompanyId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !pageId || !pageAccessToken || !label}>
                {creating ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Page ID</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-faint">
                  No Facebook Pages connected yet.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.label}</TableCell>
                  <TableCell className="text-muted-foreground">{p.pageId}</TableCell>
                  <TableCell className="text-muted-foreground">{p.company?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.enabled ? "success" : "neutral"}>{p.enabled ? "Connected" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      Disconnect
                    </Button>
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
