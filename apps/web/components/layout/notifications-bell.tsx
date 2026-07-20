"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/v1/notifications")
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative cursor-pointer p-1.5 text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-surface bg-accent" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-faint">You&apos;re all caught up.</div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-foreground">{n.title}</span>
              {n.body && <span className="text-xs text-faint">{n.body}</span>}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
