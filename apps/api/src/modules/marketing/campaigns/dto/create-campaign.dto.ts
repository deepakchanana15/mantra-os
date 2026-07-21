import { IsOptional, IsUUID } from "class-validator";

export class CreateCampaignDto {
  @IsUUID()
  segmentId!: string;

  @IsUUID()
  templateId!: string;

  @IsOptional()
  scheduledAt?: Date;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase B. */
  @IsOptional()
  @IsUUID()
  brandId?: string;
}
