import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must be lowercase letters, numbers, and hyphens only" })
  @MinLength(2)
  @MaxLength(60)
  slug?: string;
}
