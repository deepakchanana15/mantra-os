"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Grant {
  id: string;
  user: { id: string; name: string; email: string };
}

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
}

/**
 * Owner-only in practice (the API enforces deletion_grants:manage — see
 * DECISIONS.md "Deletion governance"). This UI doesn't re-implement that
 * check; it just renders what the API returned to page.tsx (which shows
 * nothing here if the fetch came back 403).
 */
export function DeletionGrantsTab({ grants: initialGrants, members }: { grants: Grant[]; members: Member[] }) {
  const router = useRouter();
  const [grants, setGrants] = useState(initialGrants);
  const [loading, setLoading] = useState(false);

  const grantableMembers = members.filter((m) => !grants.some((g) => g.user.id === m.user.id));

  async function grantTo(userId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/deletion-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't grant delete access.");
        return;
      }
      toast.success("Delete access granted");
      setGrants((prev) => [...prev, data]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function revoke(userId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/deletion-grants/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't revoke delete access.");
        return;
      }
      toast.success("Delete access revoked");
      setGrants((prev) => prev.filter((g) => g.user.id !== userId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Only people granted here (or the Owner) can delete records — everyone else can create and edit freely but
        never delete. See <span className="font-medium text-foreground">Deletion governance</span> in the project docs.
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-faint">
                  No one has been granted delete access yet.
                </TableCell>
              </TableRow>
            ) : (
              grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell className="font-medium text-foreground">{grant.user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{grant.user.email}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" disabled={loading} onClick={() => revoke(grant.user.id)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {grantableMembers.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={loading} className="w-fit">
              Grant delete access…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {grantableMembers.map((m) => (
              <DropdownMenuItem key={m.id} onSelect={() => grantTo(m.user.id)}>
                {m.user.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
