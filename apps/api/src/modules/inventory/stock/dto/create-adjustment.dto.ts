import { IsInt, IsUUID, NotEquals } from "class-validator";

export class CreateAdjustmentDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  /** Signed delta — positive corrects stock up, negative corrects it down. Never zero. */
  @IsInt()
  @NotEquals(0)
  quantityDelta!: number;
}
