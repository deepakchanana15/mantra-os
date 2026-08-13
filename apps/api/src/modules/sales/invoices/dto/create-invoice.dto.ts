import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength, ValidateNested } from "class-validator";
import { InvoiceStatus } from "@mantra-os/db";
import { OrderLineDto } from "../../../../common/dto/order-line.dto";

export class CreateInvoiceDto {
  @IsUUID()
  customerId!: string;

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
