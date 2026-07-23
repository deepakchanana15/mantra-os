import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { SupportTicketPriority, SupportTicketStatus } from "@mantra-os/db";

export const SLA_HOUR_OPTIONS = [24, 36, 48, 72] as const;

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

  /** Optional — see DECISIONS.md "SupportTicket assignment + SLA". */
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsIn(SLA_HOUR_OPTIONS)
  slaHours?: number;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase C. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
