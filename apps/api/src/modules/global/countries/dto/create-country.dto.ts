import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCountryDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  /** ISO 3166-1 alpha-2 (US, CA, AU, NZ, NL, DE, IN, ...). */
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  isoCode!: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timeZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;

  /** Simple flat rate for V1 — see DECISIONS.md "Tax and pricing, framework not data". */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxPercentage?: number;
}
