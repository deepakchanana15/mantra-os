import { IsString, MaxLength } from "class-validator";

export class CreateBlogCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(100)
  slug!: string;
}
