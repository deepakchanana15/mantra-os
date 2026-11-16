import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Body of a public POST /v1/leads/brochure request. Sits alongside
 * LeadIntakeDto — same public, per-Company-key auth — but is deliberately
 * a separate, narrower endpoint: it never replaces a site's existing
 * contact-form integration, it just flags that a brochure should also go
 * out for whichever lead a site's own form just submitted.
 */
export class BrochureRequestDto {
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

  /** Which site is asking — picks the brochure file(s) to send. Defaults to English. */
  @IsOptional()
  @IsIn(["en", "de", "nl"])
  locale?: "en" | "de" | "nl";
}
