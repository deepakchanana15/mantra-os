import { IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  sku!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase B. */
  @IsOptional()
  @IsUUID()
  brandId?: string;

  /** Optional — see DECISIONS.md "Product currency follows Company/Country". */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
