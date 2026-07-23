"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddressFields } from "@/components/domain/address-fields";
import { EMPTY_ADDRESS, isAddressEmpty, type AddressValue } from "@/lib/address";
import { CompanyCountrySelect } from "@/components/domain/company-country-select";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface PhoneRow {
  id?: string;
  label: string;
  number: string;
  isPrimary: boolean;
}

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  address: AddressValue | null;
  companyId: string | null;
  countryId: string | null;
  phones: { id: string; label: string; number: string; isPrimary: boolean }[];
}

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/suppliers/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Supplier | null) => {
        if (!data) return;
        setSupplier(data);
        setName(data.name);
        setEmail(data.email ?? "");
        setAddress({ ...EMPTY_ADDRESS, ...(data.address ?? {}) });
        setPhones(data.phones.map((p) => ({ id: p.id, label: p.label, number: p.number, isPrimary: p.isPrimary })));
        setCompanyId(data.companyId ?? undefined);
        setCountryId(data.countryId ?? undefined);
      });
  }, [params.id]);

  function addPhone() {
    setPhones((prev) => [...prev, { label: "", number: "", isPrimary: prev.length === 0 }]);
  }
  function updatePhone(index: number, patch: Partial<PhoneRow>) {
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }
  function removePhone(index: number) {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  }
  function setPrimary(index: number) {
    setPhones((prev) => prev.map((p, i) => ({ ...p, isPrimary: i === index })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/suppliers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          address: isAddressEmpty(address) ? undefined : address,
          phones: phones
            .filter((p) => p.label && p.number)
            .map((p) => ({ label: p.label, number: p.number, isPrimary: p.isPrimary })),
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update the supplier.");
        return;
      }
      toast.success("Supplier updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!supplier) {
    return <p className="p-7 text-sm text-faint">Loading supplier…</p>;
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/suppliers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Suppliers
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">{supplier.name}</h1>
        </div>
        <DeleteEntityButton apiPath={`/api/v1/suppliers/${supplier.id}`} entityLabel="Supplier" redirectTo="/suppliers" />
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Phone numbers</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addPhone}>
                  <Plus className="h-3.5 w-3.5" />
                  Add phone
                </Button>
              </div>
              {phones.length === 0 && <p className="text-xs text-faint">No phone numbers yet.</p>}
              {phones.map((phone, index) => (
                <div key={phone.id ?? index} className="flex items-center gap-2">
                  <Input
                    placeholder="Label (Mobile, Office, WhatsApp...)"
                    className="w-44 shrink-0"
                    value={phone.label}
                    onChange={(e) => updatePhone(index, { label: e.target.value })}
                  />
                  <Input
                    placeholder="Number"
                    value={phone.number}
                    onChange={(e) => updatePhone(index, { number: e.target.value })}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="radio"
                      name="primaryPhone"
                      checked={phone.isPrimary}
                      onChange={() => setPrimary(index)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    Primary
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePhone(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Label className="text-sm font-semibold text-foreground">Address</Label>
              <AddressFields idPrefix="supplier-address" value={address} onChange={setAddress} />
            </div>

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

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
