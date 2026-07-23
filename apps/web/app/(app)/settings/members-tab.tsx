"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Member {
  id: string;
  user: { name: string; email: string };
  role: { key: string; name: string };
}

const ROLE_KEYS = ["owner", "admin", "manager", "member", "viewer"];

function roleLabel(key: string): string {
  return key[0].toUpperCase() + key.slice(1);
}

/**
 * Creates the login directly — no email-verification step, since Resend
 * isn't fully set up yet (see TODO.md). The Owner/Admin tells the new
 * teammate their temporary password out of band. See DECISIONS.md "Member
 * creation (no self-service invite)".
 */
function AddMemberDialog({ onCreated }: { onCreated: (member: Member) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleKey, setRoleKey] = useState("member");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, roleKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't add this team member.");
        return;
      }
      toast.success(`${name} added — share their temporary password with them directly`);
      onCreated(data);
      setName("");
      setEmail("");
      setPassword("");
      setRoleKey("member");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Add team member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-name">Name</Label>
            <Input id="member-name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-password">Temporary password</Label>
            <Input
              id="member-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters. Share this with them directly — there's no invite email yet.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {roleLabel(roleKey)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {ROLE_KEYS.map((key) => (
                  <DropdownMenuItem key={key} onSelect={() => setRoleKey(key)}>
                    {roleLabel(key)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add team member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
    <div className="flex flex-col gap-3">
      <AddMemberDialog onCreated={(member) => setMembers((prev) => [...prev, member])} />

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
                      <Button variant="ghost" size="sm" className="gap-1.5 border border-border" disabled={busyId === member.id}>
                        <Badge variant="neutral">{member.role.name}</Badge>
                        <ChevronDown className="h-3.5 w-3.5 text-faint" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ROLE_KEYS.map((key) => (
                        <DropdownMenuItem key={key} onSelect={() => updateRole(member.id, key)}>
                          {roleLabel(key)}
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
    </div>
  );
}
