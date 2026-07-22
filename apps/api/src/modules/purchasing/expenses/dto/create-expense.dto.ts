import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Min, MaxLength, MinLength } from "class-validator";
import { ExpenseCategory } from "@mantra-os/db";

export class CreateExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  vendorName!: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory = ExpenseCategory.OTHER;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsUrl()
  receiptFileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  goodsReceiptId?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture". */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
