import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Body of a public POST /v1/leads/welcome request. Sits alongside
 * BrochureRequestDto — same public, per-Company-key auth — but is the B2C
 * (GENERAL enquiry) equivalent: a "thanks for reaching out" email with a
 * link to the company's own blog, rather than a gated B2B brochure.
 */
export class WelcomeRequestDto {
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
}
