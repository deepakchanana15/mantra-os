import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  /** ABN (AU), VAT/USt-IdNr (DE), BTW (NL), GST/HST (CA), EIN (US), etc. — printed on invoices. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  /** Free-text postal address, printed as-is on invoices. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  /** Free-text payment/bank details (account name, BSB/routing, account number, bank name), printed as-is on Invoices only. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bankDetails?: string;

  /** Pre-fills an invoice's Consignee phone when this Company is picked as the consignee. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  /** LUT (Letter of Undertaking) ARN — only meaningful for an INR-based company exporting without IGST. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lutArn?: string;

  @IsOptional()
  @IsUUID()
  baseCurrencyId?: string;
}
