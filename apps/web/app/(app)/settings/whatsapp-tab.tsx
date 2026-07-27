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

interface WhatsAppPhoneNumber {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  label: string;
  enabled: boolean;
  company: { name: string } | null;
  createdAt: string;
}

/**
 * Connects a WhatsApp Business phone number so its incoming messages
 * become Opportunities automatically. See DECISIONS.md "WhatsApp lead
 * capture". The webhook URL/verify token shown here are the two values
 * Meta's webhook subscription setup needs — the App Secret (for signature
 * verification) is a server-side env var, never shown in the UI.
 */
export function WhatsAppTab({
  phoneNumbers: initial,
  companies,
  webhookUrl,
}: {
  phoneNumbers: WhatsAppPhoneNumber[];
  companies: Company[];
  webhookUrl: string;
}) {
  const [phoneNumbers, setPhoneNumbers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
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
      const res = await fetch("/api/v1/whatsapp-phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId,
          displayPhoneNumber: displayPhoneNumber || undefined,
          label,
          companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't connect this number.");
        return;
      }
      toast.success("WhatsApp number connected");
      setPhoneNumbers((prev) => [data, ...prev]);
      setPhoneNumberId("");
      setDisplayPhoneNumber("");
      setLabel("");
      setCompanyId(undefined);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/whatsapp-phone-numbers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error?.message ?? "Couldn't disconnect this number.");
      return;
    }
    toast.success("Number disconnected — new messages to it will no longer create Opportunities");
    setPhoneNumbers((prev) => prev.filter((p) => p.id !== id));
  }

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">Webhook setup (Meta Developer App → WhatsApp → Configuration)</p>
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
          values if Meta's webhook setup asks for them.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Connect a WhatsApp Business phone number so its incoming messages become Opportunities automatically. Find
        the phone number ID under WhatsApp → API Setup in the Meta Developer App.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            Connect a number
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a WhatsApp number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone-number-id">Phone number ID</Label>
              <Input
                id="phone-number-id"
                required
                placeholder="From Meta's WhatsApp > API Setup page"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-phone-number">Phone number (for display)</Label>
              <Input
                id="display-phone-number"
                placeholder="e.g. +61 466 242 222"
                value={displayPhoneNumber}
                onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wa-label">Label</Label>
              <Input
                id="wa-label"
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
              <Button type="submit" disabled={creating || !phoneNumberId || !label}>
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
              <TableHead>Phone number</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {phoneNumbers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-faint">
                  No WhatsApp numbers connected yet.
                </TableCell>
              </TableRow>
            ) : (
              phoneNumbers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.label}</TableCell>
                  <TableCell className="text-muted-foreground">{p.displayPhoneNumber ?? p.phoneNumberId}</TableCell>
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
