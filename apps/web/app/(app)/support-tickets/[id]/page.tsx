"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Member {
  id: string;
  name: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  assignedToId: string | null;
  slaHours: number | null;
  dueAt: string | null;
  customer: { name: string };
}

const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const SLA_OPTIONS = [24, 36, 48, 72];

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  OPEN: "neutral",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "success",
};

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState("OPEN");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [slaHours, setSlaHours] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/support-tickets/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SupportTicket | null) => {
        if (!data) return;
        setTicket(data);
        setStatus(data.status);
        setPriority(data.priority);
        setAssignedToId(data.assignedToId ?? undefined);
        setSlaHours(data.slaHours ?? undefined);
      });
    fetch("/api/v1/support-tickets/assignable-members").then((res) => (res.ok ? res.json() : [])).then(setMembers);
  }, [params.id]);

  const selectedAssignee = members.find((m) => m.id === assignedToId);
  const selectedStatus = STATUSES.find((s) => s.value === status);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);
  const isOverdue = ticket?.dueAt && new Date(ticket.dueAt) < new Date() && !["RESOLVED", "CLOSED"].includes(status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/support-tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, assignedToId, slaHours }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update the ticket.");
        return;
      }
      toast.success("Ticket updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!ticket) {
    return <p className="p-7 text-sm text-faint">Loading ticket…</p>;
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/support-tickets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Support Tickets
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
            <Badge variant={STATUS_VARIANT[status] ?? "neutral"}>{selectedStatus?.label}</Badge>
          </div>
          <p className="text-xs text-faint">{ticket.customer.name}</p>
          {ticket.dueAt && (
            <p className={`mt-1 text-xs ${isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
              Due {new Date(ticket.dueAt).toLocaleString()}
              {isOverdue && " — overdue"}
            </p>
          )}
        </div>
        <DeleteEntityButton
          apiPath={`/api/v1/support-tickets/${ticket.id}`}
          entityLabel="Support ticket"
          redirectTo="/support-tickets"
        />
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          {ticket.description && <p className="mb-4 text-sm text-muted-foreground">{ticket.description}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {selectedStatus?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {STATUSES.map((s) => (
                      <DropdownMenuItem key={s.value} onSelect={() => setStatus(s.value)}>
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {selectedPriority?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {PRIORITIES.map((p) => (
                      <DropdownMenuItem key={p.value} onSelect={() => setPriority(p.value)}>
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Assigned to</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {selectedAssignee?.name ?? "Unassigned"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                    <DropdownMenuItem onSelect={() => setAssignedToId(undefined)}>Unassigned</DropdownMenuItem>
                    {members.map((m) => (
                      <DropdownMenuItem key={m.id} onSelect={() => setAssignedToId(m.id)}>
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>SLA</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {slaHours ? `${slaHours} hours` : "No SLA"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuItem onSelect={() => setSlaHours(undefined)}>No SLA</DropdownMenuItem>
                    {SLA_OPTIONS.map((hours) => (
                      <DropdownMenuItem key={hours} onSelect={() => setSlaHours(hours)}>
                        {hours} hours
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
