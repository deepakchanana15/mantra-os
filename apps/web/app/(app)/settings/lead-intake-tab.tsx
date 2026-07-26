"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
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

interface Company {
  id: string;
  name: string;
}

interface LeadIntakeKey {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  company: { name: string };
  createdAt: string;
}

/** One secret per website — pastes into that site's form-submit code to authenticate POST /v1/leads/intake. See DECISIONS.md "Public lead intake: website forms, Phase 5 (lead attribution)". */
export function LeadIntakeTab({ keys: initial, companies }: { keys: LeadIntakeKey[]; companies: Company[] }) {
  const [keys, setKeys] = useState(initial);
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/lead-intake-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, label }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the key.");
        return;
      }
      toast.success("Key created");
      setKeys((prev) => [data, ...prev]);
      setCompanyId(undefined);
      setLabel("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/lead-intake-keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error?.message ?? "Couldn't delete the key.");
      return;
    }
    toast.success("Key deleted — that site's form will stop working until it's given a new one");
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        One key per website — paste it into that site's quote/contact form so submissions create an Opportunity
        here automatically. Anyone with the key can submit leads, so treat it like a password, not a public value.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            Create key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New lead intake key</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Company</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCompanyName ?? "Select a company"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {companies.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCompanyId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key-label">Label</Label>
              <Input
                id="key-label"
                required
                placeholder="e.g. Mantra Sports USA — Shopify"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !companyId}>
                {creating ? "Creating…" : "Create key"}
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
              <TableHead>Company</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-faint">
                  No lead intake keys yet.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium text-foreground">{k.label}</TableCell>
                  <TableCell className="text-muted-foreground">{k.company.name}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => copy(k.key)}
                      className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-accent"
                    >
                      <Copy className="h-3 w-3 shrink-0" />
                      <span className="truncate">{k.key}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)}>
                      Delete
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
