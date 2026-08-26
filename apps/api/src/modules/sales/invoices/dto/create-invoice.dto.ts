import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength, ValidateNested } from "class-validator";
import { InvoiceStatus } from "@mantra-os/db";
import { OrderLineDto } from "../../../../common/dto/order-line.dto";

export class CreateInvoiceDto {
  /** Optional — see `consigneeCompanyId`. At least one of the two must be provided (enforced in InvoicesService). */
  @IsOptional()
  @IsUUID()
  customerId?: string;

  /** Intercompany consignee — pick from this org's own Companies rather than Customers. See DECISIONS.md "India export invoice compliance". */
  @IsOptional()
  @IsUUID()
  consigneeCompanyId?: string;

  /** Overrides consigneeCompany.phone when set — lets the phone be entered manually when the Company has none on file. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  consigneePhone?: string;

  /** Optional — the Purchase Order this export invoice was raised against. */
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  invoiceNumber!: string;

  @IsEnum(InvoiceStatus)
  status: InvoiceStatus = InvoiceStatus.DRAFT;

  /**
   * Required when `lines` isn't provided (a standalone total, the original
   * minimal-version behavior). When `lines` is provided, the amount is
   * computed server-side from them instead — see DECISIONS.md "Invoice line
   * items". Enforced in InvoicesService, not here, since "one of two fields
   * required" isn't a single-field validator.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  /** Optional — itemized lines (quantity, product, unit price), auto-totaled. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines?: OrderLineDto[];

  /** Dollar discount off the subtotal (amount, or the sum of lines) — see DECISIONS.md "Invoice/Sales Order discounts". Percent is a frontend-only convenience, never submitted. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  /** Adds a GST/IGST line on top of the post-discount total — 10% for AU unless gstRate overrides it. */
  @IsOptional()
  @IsBoolean()
  gstApplicable?: boolean;

  /** Overrides the default 10% rate — India's IGST varies by HSN code (5/12/18/28%). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gstRate?: number;

  /** India export invoices: goods exported under LUT carry no IGST — mutually exclusive with gstApplicable in practice. */
  @IsOptional()
  @IsBoolean()
  exportUnderLut?: boolean;

  /** Buyer's own tax identifier (e.g. an overseas buyer's ABN), printed on export invoices. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  buyerTaxId?: string;

  /** India export invoice compliance fields — all optional. See DECISIONS.md "India export invoice compliance". */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  carriageBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeOfReceipt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  flightOrVesselNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  portOfLoading?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  portOfDischarge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  freightTerms?: string;

  /** 1 unit of the invoice's own currency = exchangeRate INR — used to print the INR taxable value/IGST amount export invoices require. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase C. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
