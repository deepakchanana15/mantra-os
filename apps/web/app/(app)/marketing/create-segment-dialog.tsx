"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CUSTOMER_TYPES as ALL_CUSTOMER_TYPES } from "@/lib/customer-types";

const CUSTOMER_TYPE_FILTER_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "Any customer type" },
  ...ALL_CUSTOMER_TYPES,
];

/** V1's filter is deliberately one field — see segment-filter.dto.ts on the backend. */
export function CreateSegmentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerType, setCustomerType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filter: { customerType } }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the segment.");
        return;
      }
      toast.success("Segment created");
      setName("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const currentLabel = CUSTOMER_TYPE_FILTER_OPTIONS.find((t) => t.value === customerType)?.label;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Segment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New segment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="segment-name">Name</Label>
            <Input id="segment-name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Filter</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {currentLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                {CUSTOMER_TYPE_FILTER_OPTIONS.map((t) => (
                  <DropdownMenuItem key={t.label} onSelect={() => setCustomerType(t.value)}>
                    {t.label}
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
              {loading ? "Creating…" : "Create segment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
