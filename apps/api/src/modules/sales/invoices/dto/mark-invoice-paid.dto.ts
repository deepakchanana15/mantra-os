import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { AttachmentInputDto } from "../../../../common/dto/attachment-input.dto";

/** Proof of payment (e.g. a bank statement screenshot) — mandatory, see DECISIONS.md "Invoice payment confirmation". */
export class MarkInvoicePaidDto {
  @IsArray()
  @ArrayMinSize(1, { message: "Upload at least one bank statement screenshot as proof of payment" })
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments!: AttachmentInputDto[];
}
