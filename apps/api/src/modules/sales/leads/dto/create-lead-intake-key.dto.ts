import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateLeadIntakeKeyDto {
  @IsUUID()
  companyId!: string;

  /** e.g. "Mantra Sports USA — Shopify" — just a label to tell keys apart. */
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  label!: string;
}
