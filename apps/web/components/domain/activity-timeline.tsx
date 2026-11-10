"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Eye, FileText, MessageSquare, Receipt, ShoppingCart, Smartphone, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddNoteForm } from "./add-note-form";

interface ActivityEntry {
  id: string;
  type: "CREATED" | "STAGE_CHANGE" | "WHATSAPP_MESSAGE" | "QUOTE" | "SALES_ORDER" | "INVOICE" | "NOTE" | "AUDIT";
  timestamp: string;
  title: string;
  detail: string | null;
  actor: string | null;
}

interface ViewSummary {
  userId: string;
  userName: string;
  lastViewedAt: string;
  viewCount: number;
}

interface ViewLogEntry {
  id: string;
  createdAt: string;
  performedBy: { id: string; name: string };
}

const ICONS: Record<ActivityEntry["type"], typeof Clock> = {
  CREATED: Zap,
  STAGE_CHANGE: Clock,
  WHATSAPP_MESSAGE: Smartphone,
  QUOTE: FileText,
  SALES_ORDER: ShoppingCart,
  INVOICE: Receipt,
  NOTE: MessageSquare,
  AUDIT: Eye,
};

/**
 * Shared across the Opportunity and Customer detail pages — basePath is
 * that entity's own API path (e.g. "/opportunities/<id>"), which already
 * has /activity, /views, and /notes sub-routes on the NestJS side (see
 * OpportunitiesController/CustomersController).
 */
export function ActivityTimeline({ basePath }: { basePath: string }) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [views, setViews] = useState<ViewSummary[] | null>(null);
  const [viewLog, setViewLog] = useState<ViewLogEntry[] | null>(null);

  const load = useCallback(async () => {
    const [activityRes, viewsRes] = await Promise.all([fetch(`/api/v1${basePath}/activity`), fetch(`/api/v1${basePath}/views`)]);
    setEntries(activityRes.ok ? await activityRes.json() : []);
    setViews(viewsRes.ok ? await viewsRes.json() : []);
  }, [basePath]);

  useEffect(() => {
    load();
  }, [load]);

  const loadViewLog = useCallback(async () => {
    const res = await fetch(`/api/v1${basePath}/views/log`);
    setViewLog(res.ok ? await res.json() : []);
  }, [basePath]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>Activity</CardTitle>
        {views && views.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-faint">
            <span>Viewed by {views.map((v) => `${v.userName}${v.viewCount > 1 ? ` (${v.viewCount}×)` : ""}`).join(", ")}</span>
            <Dialog onOpenChange={(open) => open && loadViewLog()}>
              <DialogTrigger asChild>
                <button type="button" className="text-accent hover:underline">
                  View access log
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Access log</DialogTitle>
                </DialogHeader>
                {viewLog === null ? (
                  <p className="text-sm text-faint">Loading…</p>
                ) : viewLog.length === 0 ? (
                  <p className="text-sm text-faint">No views recorded.</p>
                ) : (
                  <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                    {viewLog.map((v) => (
                      <li key={v.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{v.performedBy.name}</span>
                        <span className="text-xs text-faint">{new Date(v.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {entries === null ? (
          <p className="text-sm text-faint">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-faint">No activity yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {entries.map((entry) => {
              const Icon = ICONS[entry.type];
              return (
                <li key={entry.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-faint">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-foreground">{entry.title}</p>
                    {entry.detail && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.detail}</p>}
                    <p className="text-xs text-faint">
                      {new Date(entry.timestamp).toLocaleString()}
                      {entry.actor ? ` · ${entry.actor}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>

      <AddNoteForm basePath={basePath} onAdded={load} />
    </Card>
  );
}
