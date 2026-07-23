import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

/** One uploaded file's metadata — the browser uploads the bytes to Vercel Blob directly, this just records the result. */
export class AttachmentInputDto {
  @IsUrl()
  fileUrl!: string;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contentType?: string;
}
