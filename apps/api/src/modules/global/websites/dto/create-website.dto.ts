import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateWebsiteDto {
  @IsUUID()
  countryId!: string;

  @IsUUID()
  brandId!: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shopifyStoreId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;
}
