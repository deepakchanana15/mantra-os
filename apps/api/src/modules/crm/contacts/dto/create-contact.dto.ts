import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateContactDto {
  @IsUUID()
  customerId!: string;

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
  @IsString()
  @MaxLength(100)
  role?: string;
}
