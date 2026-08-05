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

  @IsOptional()
  @IsUUID()
  baseCurrencyId?: string;
}
