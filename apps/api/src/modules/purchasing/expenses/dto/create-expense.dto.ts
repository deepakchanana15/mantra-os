import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength, ValidateNested } from "class-validator";
import { ExpenseCategory } from "@mantra-os/db";
import { AttachmentInputDto } from "../../../../common/dto/attachment-input.dto";

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

  /** Optional — one or more receipts/invoices, uploaded direct to Vercel Blob by the client. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];

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
