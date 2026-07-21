import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { SupportTicketPriority, SupportTicketStatus } from "@mantra-os/db";

export class CreateSupportTicketDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus = SupportTicketStatus.OPEN;

  @IsEnum(SupportTicketPriority)
  priority: SupportTicketPriority = SupportTicketPriority.MEDIUM;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase C. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
