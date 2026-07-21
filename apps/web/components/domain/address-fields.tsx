"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddressValue } from "@/lib/address";

/** Controlled input group for the shared Customer/Supplier/Warehouse address shape. */
export function AddressFields({
  value,
  onChange,
  idPrefix,
  disabled = false,
}: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  idPrefix: string;
  disabled?: boolean;
}) {
  function set(field: keyof AddressValue, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-line1`}>Street address</Label>
        <Input
          id={`${idPrefix}-line1`}
          value={value.line1 ?? ""}
          onChange={(e) => set("line1", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-line2`}>Address line 2</Label>
        <Input
          id={`${idPrefix}-line2`}
          value={value.line2 ?? ""}
          onChange={(e) => set("line2", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-city`}>City</Label>
          <Input
            id={`${idPrefix}-city`}
            value={value.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-state`}>State</Label>
          <Input
            id={`${idPrefix}-state`}
            value={value.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-postalCode`}>PIN / ZIP code</Label>
          <Input
            id={`${idPrefix}-postalCode`}
            value={value.postalCode ?? ""}
            onChange={(e) => set("postalCode", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <Input
            id={`${idPrefix}-country`}
            value={value.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
