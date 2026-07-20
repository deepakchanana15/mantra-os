import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from "class-validator";

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}
