import { PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseOrderDto } from "./create-purchase-order.dto";

/** Only draft purchase orders can be edited — see PurchaseOrdersService.update(). */
export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}
