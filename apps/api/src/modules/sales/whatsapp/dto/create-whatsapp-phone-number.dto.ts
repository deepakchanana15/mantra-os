import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateWhatsAppPhoneNumberDto {
  /** Meta's own identifier for this number, from WhatsApp > API Setup in the Meta Developer App. */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  phoneNumberId!: string;

  /** e.g. "+61 466 242 222" — just for display, not used to identify the number. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  displayPhoneNumber?: string;

  /** e.g. "Mantra Sports AU — WhatsApp" — a label to tell numbers apart. */
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  label!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
