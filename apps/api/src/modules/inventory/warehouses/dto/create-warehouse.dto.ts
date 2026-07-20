import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { AddressDto } from "../../../../common/dto/address.dto";

export class CreateWarehouseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
