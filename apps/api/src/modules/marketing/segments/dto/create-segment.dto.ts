import { Type } from "class-transformer";
import { IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { SegmentFilterDto } from "./segment-filter.dto";

export class CreateSegmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ValidateNested()
  @Type(() => SegmentFilterDto)
  filter!: SegmentFilterDto;
}
