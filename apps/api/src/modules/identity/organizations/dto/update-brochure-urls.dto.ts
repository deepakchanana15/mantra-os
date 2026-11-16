import { IsOptional, IsUrl } from "class-validator";

/**
 * Each field is the Vercel Blob URL from a fresh upload via
 * POST /api/uploads (apps/web) — see Settings → Brochures. Replacing a
 * brochure is just a new upload + this PATCH, never a code change.
 */
export class UpdateBrochureUrlsDto {
  @IsOptional()
  @IsUrl()
  brochureUrlEn?: string;

  @IsOptional()
  @IsUrl()
  brochureUrlDe?: string;

  @IsOptional()
  @IsUrl()
  brochureUrlNl?: string;
}
