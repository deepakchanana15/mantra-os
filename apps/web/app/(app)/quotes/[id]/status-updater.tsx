"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StatusUpdater({
  apiPath,
  statuses,
  currentStatus,
}: {
  apiPath: string;
  statuses: string[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    if (status === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update status.");
        return;
      }
      toast.success(`Status updated to ${status}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? "Updating…" : `Status: ${currentStatus}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statuses.map((status) => (
          <DropdownMenuItem key={status} onSelect={() => updateStatus(status)}>
            {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
