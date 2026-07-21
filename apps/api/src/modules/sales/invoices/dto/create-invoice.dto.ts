import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from "class-validator";
import { InvoiceStatus } from "@mantra-os/db";

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

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

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
