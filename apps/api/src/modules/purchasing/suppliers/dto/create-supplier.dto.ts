import { Type } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { AddressDto } from "../../../../common/dto/address.dto";

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
