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
import { DiscountFields } from "@/components/domain/discount-fields";
import { LineItemsEditor, type LineItemRow, type ProductOption } from "@/components/domain/line-items-editor";
import { isValidDateInputValue } from "@/lib/date-input";

interface Customer {
  id: string;
  name: string;
}

interface SalesOrder {
  id: string;
  orderDate: string;
  customer: { name: string };
}

interface Company {
  id: string;
  name: string;
  legalName: string | null;
  phone: string | null;
  baseCurrency?: { code: string } | null;
}

interface PurchaseOrder {
  id: string;
  poNumber: string | null;
  companyId: string | null;
  countryId: string | null;
  supplier: { name: string };
  lines: { productId: string; quantity: number; unitCost: string }[];
}

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

function defaultInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [consigneeCompanyId, setConsigneeCompanyId] = useState<string | undefined>(undefined);
  const [consigneePhone, setConsigneePhone] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | undefined>(undefined);
  const [salesOrderId, setSalesOrderId] = useState<string | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [status, setStatus] = useState("DRAFT");
  const [itemize, setItemize] = useState(false);
  const [lines, setLines] = useState<LineItemRow[]>([]);
  const [amount, setAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState("");
  const [exportUnderLut, setExportUnderLut] = useState(false);
  const [buyerTaxId, setBuyerTaxId] = useState("");
  const [carriageBy, setCarriageBy] = useState("");
  const [placeOfReceipt, setPlaceOfReceipt] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [flightOrVesselNumber, setFlightOrVesselNumber] = useState("");
  const [portOfLoading, setPortOfLoading] = useState("");
  const [portOfDischarge, setPortOfDischarge] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [freightTerms, setFreightTerms] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [issuedAt, setIssuedAt] = useState(() => isoDate(new Date()));
  const [dueDate, setDueDate] = useState(() => isoDate(new Date()));
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers").then((res) => (res.ok ? res.json() : [])).then(setCustomers);
    fetch("/api/v1/sales-orders").then((res) => (res.ok ? res.json() : [])).then(setSalesOrders);
    fetch("/api/v1/products").then((res) => (res.ok ? res.json() : [])).then(setProducts);
    fetch("/api/v1/companies").then((res) => (res.ok ? res.json() : [])).then(setCompanies).catch(() => setCompanies([]));
    fetch("/api/v1/purchase-orders").then((res) => (res.ok ? res.json() : [])).then(setPurchaseOrders).catch(() => setPurchaseOrders([]));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSalesOrder = salesOrders.find((o) => o.id === salesOrderId);
  const selectedStatus = STATUSES.find((s) => s.value === status);
  const selectedConsignee = companies.find((c) => c.id === consigneeCompanyId);
  const selectedPurchaseOrder = purchaseOrders.find((p) => p.id === purchaseOrderId);
  const isIndianCompany = companies.find((c) => c.id === companyId)?.baseCurrency?.code === "INR";
  const validLines = lines.filter((l) => l.productId);
  const computedTotal = validLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const subtotal = itemize ? computedTotal : Number(amount) || 0;
  const total = subtotal - discountAmount;
  const effectiveGstRate = isIndianCompany ? Number(gstRate) || 0 : 10;
  const gst = !exportUnderLut && gstApplicable ? Math.round(total * (effectiveGstRate / 100) * 100) / 100 : 0;
  const grandTotal = total + gst;
  const exchangeRateNum = Number(exchangeRate) || 0;

  function applyPurchaseOrder(po: PurchaseOrder | undefined) {
    setPurchaseOrderId(po?.id);
    if (!po) return;
    setConsigneeCompanyId(po.companyId ?? undefined);
    if (po.countryId) setCountryId(po.countryId);
    if (po.lines.length > 0) {
      setItemize(true);
      setLines(po.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: Number(l.unitCost) })));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId && !consigneeCompanyId) return;
    if (itemize && validLines.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          consigneeCompanyId,
          consigneePhone: consigneePhone || undefined,
          purchaseOrderId,
          salesOrderId,
          invoiceNumber,
          status,
          amount: itemize ? undefined : Number(amount),
          lines: itemize ? validLines : undefined,
          discountAmount: discountAmount || undefined,
          gstApplicable: (gstApplicable && !exportUnderLut) || undefined,
          gstRate: isIndianCompany && gstRate ? Number(gstRate) : undefined,
          exportUnderLut: exportUnderLut || undefined,
          buyerTaxId: buyerTaxId || undefined,
          carriageBy: carriageBy || undefined,
          placeOfReceipt: placeOfReceipt || undefined,
          countryOfOrigin: countryOfOrigin || undefined,
          flightOrVesselNumber: flightOrVesselNumber || undefined,
          portOfLoading: portOfLoading || undefined,
          portOfDischarge: portOfDischarge || undefined,
          paymentTerms: paymentTerms || undefined,
          freightTerms: freightTerms || undefined,
          exchangeRate: exchangeRate ? Number(exchangeRate) : undefined,
          issuedAt: issuedAt || undefined,
          dueDate: dueDate || undefined,
          companyId,
          countryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the invoice.");
        return;
      }
      toast.success("Invoice created");
      router.push("/invoices");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Link href="/invoices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Invoices
        </Link>
        <h1 className="mt-1 text-xl font-bold text-foreground">New Invoice</h1>
      </div>

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoiceNumber">Invoice number</Label>
              <Input
                id="invoiceNumber"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <CompanyCountrySelect
              companyId={companyId}
              countryId={countryId}
              onCompanyChange={setCompanyId}
              onCountryChange={setCountryId}
            />

            {isIndianCompany && (
              <div className="flex flex-col gap-1.5">
                <Label>Purchase order</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-start">
                      {selectedPurchaseOrder
                        ? `${selectedPurchaseOrder.poNumber ?? selectedPurchaseOrder.id.slice(0, 8)} — ${selectedPurchaseOrder.supplier.name}`
                        : "No purchase order"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                    <DropdownMenuItem onSelect={() => applyPurchaseOrder(undefined)}>No purchase order</DropdownMenuItem>
                    {purchaseOrders.map((po) => (
                      <DropdownMenuItem key={po.id} onSelect={() => applyPurchaseOrder(po)}>
                        {po.poNumber ?? po.id.slice(0, 8)} — {po.supplier.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-faint">Selecting a PO pre-fills the consignee and line items — both stay editable.</p>
              </div>
            )}

            {isIndianCompany ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Consignee</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" type="button" className="w-full justify-start">
                        {selectedConsignee?.legalName ?? selectedConsignee?.name ?? "Select the consignee company"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                      {companies.map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onSelect={() => {
                            setConsigneeCompanyId(c.id);
                            setConsigneePhone(c.phone ?? "");
                          }}
                        >
                          {c.legalName ?? c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-faint">Address, legal name, ABN/ACN etc. are pulled from this Company automatically.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="consigneePhone">Consignee phone</Label>
                  <Input
                    id="consigneePhone"
                    placeholder={selectedConsignee?.phone ? undefined : "Not on file — enter manually"}
                    value={consigneePhone}
                    onChange={(e) => setConsigneePhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Buyer (if other than consignee)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" type="button" className="w-full justify-start">
                        {selectedCustomer?.name ?? "Same as consignee"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                      <DropdownMenuItem onSelect={() => setCustomerId(undefined)}>Same as consignee</DropdownMenuItem>
                      {customers.map((c) => (
                        <DropdownMenuItem key={c.id} onSelect={() => setCustomerId(c.id)}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="buyerTaxId">Buyer tax ID (e.g. ABN)</Label>
                  <Input id="buyerTaxId" value={buyerTaxId} onChange={(e) => setBuyerTaxId(e.target.value)} />
                </div>
              </>
            ) : (
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
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Sales order</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {selectedSalesOrder
                      ? `${selectedSalesOrder.customer.name} — ${new Date(selectedSalesOrder.orderDate).toLocaleDateString()}`
                      : "No sales order"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  <DropdownMenuItem onSelect={() => setSalesOrderId(undefined)}>No sales order</DropdownMenuItem>
                  {salesOrders.map((o) => (
                    <DropdownMenuItem key={o.id} onSelect={() => setSalesOrderId(o.id)}>
                      {o.customer.name} — {new Date(o.orderDate).toLocaleDateString()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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

            <label className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={itemize}
                onChange={(e) => setItemize(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-accent"
              />
              Itemize with line items (auto-totals the amount)
            </label>

            {itemize ? (
              <LineItemsEditor
                products={products}
                priceLabel="Unit Price"
                priceSource="unitPrice"
                lines={lines}
                onChange={setLines}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required={!itemize}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            )}

            <DiscountFields subtotal={subtotal} discountAmount={discountAmount} onDiscountAmountChange={setDiscountAmount} />

            {isIndianCompany ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <Label>Tax treatment</Label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={!gstApplicable && !exportUnderLut}
                    onChange={() => {
                      setGstApplicable(false);
                      setExportUnderLut(false);
                    }}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  No tax
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={gstApplicable && !exportUnderLut}
                    onChange={() => {
                      setGstApplicable(true);
                      setExportUnderLut(false);
                    }}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  Pay IGST
                </label>
                {gstApplicable && !exportUnderLut && (
                  <div className="ml-5 flex flex-col gap-1.5">
                    <Label htmlFor="gstRate">IGST rate (%)</Label>
                    <Input id="gstRate" type="number" min="0" max="100" step="0.01" className="w-32" value={gstRate} onChange={(e) => setGstRate(e.target.value)} />
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={exportUnderLut}
                    onChange={() => {
                      setExportUnderLut(true);
                      setGstApplicable(false);
                    }}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  Export under LUT (no IGST charged)
                </label>
                <div className="mt-1 flex flex-col gap-1 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total</span>
                    <span className="tabular-nums">{total.toFixed(2)}</span>
                  </div>
                  {gstApplicable && !exportUnderLut && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGST ({effectiveGstRate || 0}%)</span>
                      <span className="tabular-nums">{gst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Grand Total</span>
                    <span className="tabular-nums">{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={gstApplicable}
                    onChange={(e) => setGstApplicable(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border accent-accent"
                  />
                  Add GST (10%, for Australian invoices)
                </label>
                {gstApplicable && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total</span>
                      <span className="tabular-nums">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST (10%)</span>
                      <span className="tabular-nums">${gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>Grand Total</span>
                      <span className="tabular-nums">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isIndianCompany && (
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <Label>Export particulars</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="carriageBy">Carriage by</Label>
                    <Input id="carriageBy" value={carriageBy} onChange={(e) => setCarriageBy(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="placeOfReceipt">Place of receipt</Label>
                    <Input id="placeOfReceipt" value={placeOfReceipt} onChange={(e) => setPlaceOfReceipt(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="countryOfOrigin">Country of origin</Label>
                    <Input id="countryOfOrigin" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="flightOrVesselNumber">Flight / vessel no.</Label>
                    <Input id="flightOrVesselNumber" value={flightOrVesselNumber} onChange={(e) => setFlightOrVesselNumber(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="portOfLoading">Port of loading</Label>
                    <Input id="portOfLoading" value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="portOfDischarge">Port of discharge</Label>
                    <Input id="portOfDischarge" value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="paymentTerms">Terms of delivery &amp; payment</Label>
                    <Input id="paymentTerms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="freightTerms">Freight</Label>
                    <Input id="freightTerms" value={freightTerms} onChange={(e) => setFreightTerms(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="exchangeRate">Exchange rate (1 unit = ? INR)</Label>
                  <Input id="exchangeRate" type="number" min="0" step="0.0001" className="w-40" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                  {exchangeRateNum > 0 && (
                    <p className="text-xs text-faint">Taxable value ≈ INR {(total * exchangeRateNum).toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="issuedAt">Issue date</Label>
                <Input
                  id="issuedAt"
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={issuedAt}
                  onChange={(e) => {
                    if (!isValidDateInputValue(e.target.value)) return;
                    setIssuedAt(e.target.value);
                    if (!dueDateTouched) setDueDate(e.target.value);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={dueDate}
                  onChange={(e) => {
                    if (!isValidDateInputValue(e.target.value)) return;
                    setDueDateTouched(true);
                    setDueDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={loading || (!customerId && !consigneeCompanyId) || (itemize && validLines.length === 0)}>
                {loading ? "Creating…" : "Create invoice"}
              </Button>
              <Link href="/invoices">
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
