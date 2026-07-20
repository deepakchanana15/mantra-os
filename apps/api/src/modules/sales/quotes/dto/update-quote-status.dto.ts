import { IsEnum } from "class-validator";
import { QuoteStatus } from "@mantra-os/db";

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;
}
