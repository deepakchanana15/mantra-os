import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

class SettingItemDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsOptional()
  @IsString()
  value?: string | null;
}

export class UpdateSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings!: SettingItemDto[];
}
