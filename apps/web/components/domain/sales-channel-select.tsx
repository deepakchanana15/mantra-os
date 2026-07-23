"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ONLINE_CHANNEL_TYPES, OFFLINE_CHANNEL_TYPES } from "@/lib/sales-channel";

export interface SalesChannelValue {
  salesChannel: "ONLINE" | "OFFLINE" | undefined;
  onlineChannelType?: string;
  offlineChannelType?: string;
  orderReference?: string;
}

/** Required Sales Channel (Online/Offline) with conditional optional sub-fields — see DECISIONS.md "Sales channel tracking". */
export function SalesChannelSelect({
  value,
  onChange,
}: {
  value: SalesChannelValue;
  onChange: (value: SalesChannelValue) => void;
}) {
  const selectedOnlineType = ONLINE_CHANNEL_TYPES.find((t) => t.value === value.onlineChannelType);
  const selectedOfflineType = OFFLINE_CHANNEL_TYPES.find((t) => t.value === value.offlineChannelType);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>
          Sales channel <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value.salesChannel === "ONLINE" ? "default" : "outline"}
            onClick={() => onChange({ salesChannel: "ONLINE" })}
          >
            Online
          </Button>
          <Button
            type="button"
            variant={value.salesChannel === "OFFLINE" ? "default" : "outline"}
            onClick={() => onChange({ salesChannel: "OFFLINE" })}
          >
            Offline
          </Button>
        </div>
      </div>

      {value.salesChannel === "ONLINE" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Website/Store or Marketplace (optional)</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedOnlineType?.label ?? "Not specified"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem onSelect={() => onChange({ ...value, onlineChannelType: undefined })}>
                  Not specified
                </DropdownMenuItem>
                {ONLINE_CHANNEL_TYPES.map((t) => (
                  <DropdownMenuItem key={t.value} onSelect={() => onChange({ ...value, onlineChannelType: t.value })}>
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orderReference">Order reference (optional)</Label>
            <Input
              id="orderReference"
              value={value.orderReference ?? ""}
              onChange={(e) => onChange({ ...value, orderReference: e.target.value })}
            />
          </div>
        </div>
      )}

      {value.salesChannel === "OFFLINE" && (
        <div className="flex flex-col gap-1.5">
          <Label>How was this sold? (optional)</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" type="button" className="w-full justify-start">
                {selectedOfflineType?.label ?? "Not specified"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuItem onSelect={() => onChange({ ...value, offlineChannelType: undefined })}>
                Not specified
              </DropdownMenuItem>
              {OFFLINE_CHANNEL_TYPES.map((t) => (
                <DropdownMenuItem key={t.value} onSelect={() => onChange({ ...value, offlineChannelType: t.value })}>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
