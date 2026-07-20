"use client";

import { Search } from "lucide-react";
import { NotificationsBell } from "./notifications-bell";
import { UserMenu } from "./user-menu";
import { OPEN_COMMAND_PALETTE_EVENT } from "./command-palette";

export function Topbar({
  breadcrumb,
  userName,
  userEmail,
}: {
  breadcrumb: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="text-sm text-muted-foreground">{breadcrumb}</div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          className="flex w-64 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-faint hover:border-accent"
        >
          <Search className="h-3.5 w-3.5" />
          Search or jump to...
          <span className="ml-auto rounded border border-border px-1 py-0.5 text-[10px]">⌘K</span>
        </button>
        <NotificationsBell />
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
