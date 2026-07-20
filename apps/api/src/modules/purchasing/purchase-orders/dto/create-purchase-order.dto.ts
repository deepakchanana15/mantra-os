import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsUUID, Min, ValidateNested } from "class-validator";

class PurchaseOrderLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
