import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";
import { AttachmentInputDto } from "../../../../common/dto/attachment-input.dto";

class GoodsReceiptLineDto {
  @IsUUID()
  purchaseOrderLineId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  purchaseOrderId!: string;

  @IsUUID()
  warehouseId!: string;

  /** Optional — one or more supporting documents (supplier invoice, delivery challan, packing slip, GRN copy), uploaded direct to Vercel Blob by the client. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}
