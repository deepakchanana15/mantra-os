"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Bidirectional discount entry — typing a % computes the $ amount, typing a
 * $ amount computes the %, and both stay clamped to [0, subtotal]. Only the
 * dollar amount is ever sent to the backend (see DECISIONS.md
 * "Invoice/Sales Order discounts") — % is purely a data-entry convenience
 * derived live from it and the subtotal.
 */
export function DiscountFields({
  subtotal,
  discountAmount,
  onDiscountAmountChange,
}: {
  subtotal: number;
  discountAmount: number;
  onDiscountAmountChange: (amount: number) => void;
}) {
  const [percentText, setPercentText] = useState(subtotal > 0 ? round2((discountAmount / subtotal) * 100).toString() : "0");
  const [amountText, setAmountText] = useState(discountAmount ? discountAmount.toString() : "0");

  // Subtotal changed (e.g. a line item was added/removed) — keep the dollar
  // discount fixed and just re-derive the % display against the new base.
  useEffect(() => {
    setPercentText(subtotal > 0 ? round2((discountAmount / subtotal) * 100).toString() : "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  function handlePercentChange(value: string) {
    setPercentText(value);
    const pct = parseFloat(value);
    if (Number.isNaN(pct) || subtotal <= 0) {
      setAmountText("0");
      onDiscountAmountChange(0);
      return;
    }
    const clampedPct = Math.min(100, Math.max(0, pct));
    const amt = round2((clampedPct / 100) * subtotal);
    setAmountText(amt.toString());
    onDiscountAmountChange(amt);
  }

  function handleAmountChange(value: string) {
    setAmountText(value);
    const amt = parseFloat(value);
    if (Number.isNaN(amt) || subtotal <= 0) {
      setPercentText("0");
      onDiscountAmountChange(0);
      return;
    }
    const clampedAmt = Math.min(subtotal, Math.max(0, amt));
    const pct = round2((clampedAmt / subtotal) * 100);
    setPercentText(pct.toString());
    onDiscountAmountChange(clampedAmt);
  }

  const finalTotal = round2(Math.max(0, subtotal - discountAmount));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-xs text-faint">Enter either field — the other one and the final total update automatically.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discount-percent">Discount %</Label>
          <Input
            id="discount-percent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={percentText}
            onChange={(e) => handlePercentChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discount-amount">Discount amount</Label>
          <Input
            id="discount-amount"
            type="number"
            min="0"
            step="0.01"
            value={amountText}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 border-t border-border pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount ({percentText}%)</span>
            <span className="tabular-nums">-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">${finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
