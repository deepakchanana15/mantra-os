import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/** Free-text label ("Mobile", "Office", "WhatsApp", ...) — see SupplierPhone model comment for why it's not an enum. */
export class SupplierPhoneInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  number!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
