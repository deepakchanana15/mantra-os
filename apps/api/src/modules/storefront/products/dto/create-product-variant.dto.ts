import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProductVariantDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(100)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  stockQty?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
