import { IsInt, IsNumber, IsUUID, Min } from "class-validator";

/** Shared line-item shape for Quote/SalesOrder/PurchaseOrder create payloads. */
export class OrderLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
