import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { StorefrontSiteStatus } from "@mantra-os/db";

export class CreateStorefrontSiteDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(10)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  /** The site's own pooled Postgres connection string — read/written only
   * server-side, never returned in any API response (see StorefrontSitesRepository). */
  @IsString()
  databaseUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cloudinaryCloudName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cloudinaryApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cloudinaryApiSecret?: string;

  @IsOptional()
  @IsEnum(StorefrontSiteStatus)
  status?: StorefrontSiteStatus;
}
