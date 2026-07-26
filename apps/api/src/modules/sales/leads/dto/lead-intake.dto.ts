import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Body of a public POST /v1/leads/intake submission from one of the
 * organization's own websites — see DECISIONS.md "Public lead intake:
 * website forms, Phase 5 (lead attribution)".
 */
export class LeadIntakeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalLeadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  productInterest?: string;

  /**
   * Honeypot — a hidden form field real visitors never see or fill in, but
   * simple bots often auto-fill every field they find. Any non-empty value
   * here means "silently discard, but respond as if nothing was wrong."
   */
  @IsOptional()
  @IsString()
  website?: string;
}
