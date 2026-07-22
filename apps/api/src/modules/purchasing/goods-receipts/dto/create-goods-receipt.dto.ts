import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsUUID, IsUrl, Min, ValidateNested } from "class-validator";

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

  /** Optional — scan/photo of the vendor's hard-copy receipt, uploaded direct to Vercel Blob by the client. */
  @IsOptional()
  @IsUrl()
  receiptFileUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}
