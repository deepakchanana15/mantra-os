"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyCountrySelect } from "@/components/domain/company-country-select";

interface Customer {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
}

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const SLA_OPTIONS = [24, 36, 48, 72];

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [slaHours, setSlaHours] = useState<number | undefined>(undefined);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers").then((res) => (res.ok ? res.json() : [])).then(setCustomers);
    fetch("/api/v1/support-tickets/assignable-members").then((res) => (res.ok ? res.json() : [])).then(setMembers);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);
  const selectedAssignee = members.find((m) => m.id === assignedToId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          subject,
          description: description || undefined,
          priority,
          assignedToId,
          slaHours,
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the support ticket.");
        return;
      }
      toast.success("Support ticket created");
      router.push("/support-tickets");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/support-tickets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Support Tickets
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Support Ticket</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedCustomer?.name ?? "Select a customer"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {customers.map((c) => (
                    <DropdownMenuItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Assign to (optional)</Label>
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
                <Label>SLA (optional)</Label>
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

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !customerId}>
                {loading ? "Creating…" : "Create ticket"}
              </Button>
              <Link href="/support-tickets">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
