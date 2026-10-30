import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateMetaLeadPageDto {
  /** Meta's own Page ID, from the Page's About section or the Meta Business Suite. */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  pageId!: string;

  /** A Page Access Token with the leads_retrieval and pages_manage_ads/pages_read_engagement permissions. */
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  pageAccessToken!: string;

  /** e.g. "Mantra Sports AU — Facebook Page" — a label to tell pages apart. */
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  label!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
