import { IsEnum } from "class-validator";
import { PurchaseOrderStatus } from "@mantra-os/db";

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus)
  status!: PurchaseOrderStatus;
}
