import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
