"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Integration {
  id: string;
  channel: string;
  accountId: string;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
}

const CHANNELS = [
  { key: "META", label: "Meta (Facebook/Instagram) Ads", available: true },
  { key: "GOOGLE", label: "Google Ads", available: false },
  { key: "BING", label: "Bing/Microsoft Ads", available: false },
];

const STATUS_VARIANT: Record<string, "success" | "destructive" | "neutral"> = {
  CONNECTED: "success",
  ERROR: "destructive",
  DISCONNECTED: "neutral",
};

/** Ad-platform integrations — see DECISIONS.md "Ad platform integrations, Phase 1: Meta". Only Meta is wired up so far. */
export function IntegrationsTab({ integrations: initial }: { integrations: Integration[] }) {
  const [integrations, setIntegrations] = useState(initial);
  const [connectOpen, setConnectOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    try {
      const res = await fetch("/api/v1/marketing-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "META", accessToken, accountId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't connect Meta.");
        return;
      }
      toast.success("Meta connected");
      setIntegrations((prev) => [...prev.filter((i) => i.channel !== "META"), data]);
      setAccessToken("");
      setAccountId("");
      setConnectOpen(false);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(channel: string) {
    const res = await fetch(`/api/v1/marketing-integrations/${channel}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error?.message ?? "Couldn't disconnect.");
      return;
    }
    toast.success("Disconnected");
    setIntegrations((prev) => prev.filter((i) => i.channel !== channel));
  }

  async function handleSync(channel: string) {
    setSyncingChannel(channel);
    try {
      const res = await fetch(`/api/v1/marketing-integrations/${channel}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Sync failed.");
        return;
      }
      toast.success(`Synced ${data.synced} campaign${data.synced === 1 ? "" : "s"}`);
      const listRes = await fetch("/api/v1/marketing-integrations");
      if (listRes.ok) setIntegrations(await listRes.json());
    } finally {
      setSyncingChannel(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Connect ad platforms to pull campaign spend and performance into your Dashboard. Synced automatically once a
        day, or on demand with "Sync now".
      </p>

      <div className="flex flex-col gap-3">
        {CHANNELS.map((ch) => {
          const integration = integrations.find((i) => i.channel === ch.key);
          return (
            <div
              key={ch.key}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <div className="font-medium text-foreground">{ch.label}</div>
                {integration ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={STATUS_VARIANT[integration.status] ?? "neutral"}>{integration.status}</Badge>
                    <span>Account {integration.accountId}</span>
                    {integration.lastSyncedAt && (
                      <span>· Last synced {new Date(integration.lastSyncedAt).toLocaleString()}</span>
                    )}
                    {integration.lastError && <span className="text-destructive">· {integration.lastError}</span>}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-faint">{ch.available ? "Not connected" : "Coming soon"}</p>
                )}
              </div>
              <div className="flex gap-2">
                {ch.key === "META" && integration && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncingChannel === "META"}
                      onClick={() => handleSync("META")}
                    >
                      {syncingChannel === "META" ? "Syncing…" : "Sync now"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDisconnect("META")}>
                      Disconnect
                    </Button>
                  </>
                )}
                {ch.key === "META" && !integration && (
                  <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect Meta Ads</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleConnect} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="meta-token">Access token</Label>
                          <Input
                            id="meta-token"
                            required
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            autoFocus
                          />
                          <p className="text-xs text-muted-foreground">
                            From Meta Business Manager → Users → System Users.
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="meta-account-id">Ad Account ID</Label>
                          <Input
                            id="meta-account-id"
                            required
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            The numeric ID, without the "act_" prefix.
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setConnectOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={connecting}>
                            {connecting ? "Connecting…" : "Connect"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
