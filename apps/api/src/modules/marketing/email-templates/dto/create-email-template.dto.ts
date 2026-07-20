import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateEmailTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  bodyHtml!: string;
}
