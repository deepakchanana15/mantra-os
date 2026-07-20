import { IsOptional, IsUUID } from "class-validator";

export class CreateCampaignDto {
  @IsUUID()
  segmentId!: string;

  @IsUUID()
  templateId!: string;

  @IsOptional()
  scheduledAt?: Date;
}
