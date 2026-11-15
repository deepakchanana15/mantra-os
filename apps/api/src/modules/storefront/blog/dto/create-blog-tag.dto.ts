import { IsString, MaxLength } from "class-validator";

export class CreateBlogTagDto {
  @IsString()
  @MaxLength(100)
  name!: string;
}
