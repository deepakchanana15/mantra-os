import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  customer: { name: string };
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export default async function SupportTicketsPage() {
  const tickets = await apiFetch<SupportTicket[]>("/v1/support-tickets");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} tickets</p>
        </div>
        <Link href="/support-tickets/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                  No support tickets yet.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-foreground">{ticket.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{ticket.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{STATUS_LABELS[ticket.status] ?? ticket.status}</TableCell>
                  <TableCell className="text-muted-foreground">{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/support-tickets/${ticket.id}`} entityLabel="Support ticket" />
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
