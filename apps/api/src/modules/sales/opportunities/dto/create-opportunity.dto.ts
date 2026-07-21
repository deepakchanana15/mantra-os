import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from "class-validator";
import { OpportunityStage } from "@mantra-os/db";

export class CreateOpportunityDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(OpportunityStage)
  stage: OpportunityStage = OpportunityStage.NEW;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase C. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
