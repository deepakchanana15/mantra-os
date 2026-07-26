import { IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from "class-validator";
import { OpportunityStage } from "@mantra-os/db";

export class CreateOpportunityDto {
  /**
   * Optional — see DECISIONS.md "Opportunities no longer require picking a
   * Customer". Provide this only if you already know the exact Customer to
   * link; otherwise supply leadName/leadEmail (and optionally leadPhone)
   * and the server resolves an existing Customer by email match itself.
   */
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  leadName?: string;

  @IsOptional()
  @IsEmail()
  leadEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  leadPhone?: string;

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
