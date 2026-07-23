import { Type } from "class-transformer";
import { IsArray, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from "class-validator";
import { AddressDto } from "../../../../common/dto/address.dto";
import { SupplierPhoneInputDto } from "./supplier-phone-input.dto";

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Legacy single phone — still accepted, but superseded by `phones` below. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** Optional — multiple phone numbers (mobile, office, WhatsApp, ...), one optionally marked primary. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierPhoneInputDto)
  phones?: SupplierPhoneInputDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase B. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
