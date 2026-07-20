import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from "class-validator";

class ShipmentLineDto {
  @IsUUID()
  salesOrderLineId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateShipmentDto {
  @IsUUID()
  salesOrderId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShipmentLineDto)
  lines!: ShipmentLineDto[];
}
