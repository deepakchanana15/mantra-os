"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Member {
  id: string;
  user: { name: string; email: string };
  role: { key: string; name: string };
}

const ROLE_KEYS = ["owner", "admin", "manager", "member", "viewer"];

export function MembersTab({ members: initialMembers }: { members: Member[] }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateRole(membershipId: string, roleKey: string) {
    setBusyId(membershipId);
    try {
      const res = await fetch(`/api/v1/members/${membershipId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update role.");
        return;
      }
      toast.success("Role updated");
      setMembers((prev) => prev.map((m) => (m.id === membershipId ? data : m)));
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(membershipId: string) {
    setBusyId(membershipId);
    try {
      const res = await fetch(`/api/v1/members/${membershipId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't remove this member.");
        return;
      }
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium text-foreground">{member.user.name}</TableCell>
              <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="border border-border" disabled={busyId === member.id}>
                      <Badge variant="neutral">{member.role.name}</Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ROLE_KEYS.map((key) => (
                      <DropdownMenuItem key={key} onSelect={() => updateRole(member.id, key)}>
                        {key[0].toUpperCase() + key.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === member.id}
                  onClick={() => removeMember(member.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
