"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CUSTOMER_TYPES, customerTypeDescription, customerTypeLabel } from "@/lib/customer-types";
import { AddressFields } from "@/components/domain/address-fields";
import { EMPTY_ADDRESS, isAddressEmpty, type AddressValue } from "@/lib/address";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("USER");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [shippingAddress, setShippingAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const resolvedShipping = shippingSameAsBilling ? billingAddress : shippingAddress;
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          email: email || undefined,
          phone: phone || undefined,
          billingAddress: isAddressEmpty(billingAddress) ? undefined : billingAddress,
          shippingAddress: isAddressEmpty(resolvedShipping) ? undefined : resolvedShipping,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the customer.");
        return;
      }
      toast.success("Customer created");
      router.push(`/customers/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/customers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Customers
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Customer</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {customerTypeLabel(type)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-80 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  {CUSTOMER_TYPES.map((t) => (
                    <DropdownMenuItem key={t.value} onSelect={() => setType(t.value)}>
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">{customerTypeDescription(type)}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Label className="text-sm font-semibold text-foreground">Billing address</Label>
              <AddressFields idPrefix="billing" value={billingAddress} onChange={setBillingAddress} />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Shipping address</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={shippingSameAsBilling}
                    onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border accent-accent"
                  />
                  Same as billing address
                </label>
              </div>
              {!shippingSameAsBilling && (
                <AddressFields idPrefix="shipping" value={shippingAddress} onChange={setShippingAddress} />
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create customer"}
              </Button>
              <Link href="/customers">
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
