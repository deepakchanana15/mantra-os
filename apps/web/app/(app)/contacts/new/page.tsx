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

interface Customer {
  id: string;
  name: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          name,
          role: role || undefined,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the contact.");
        return;
      }
      toast.success("Contact created");
      router.push("/contacts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/contacts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Contacts
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Contact</h1>
      </div>

      <Card className="max-w-lg">
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
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="e.g. Buyer, Accounts Payable" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || !customerId}>
                {loading ? "Creating…" : "Create contact"}
              </Button>
              <Link href="/contacts">
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
