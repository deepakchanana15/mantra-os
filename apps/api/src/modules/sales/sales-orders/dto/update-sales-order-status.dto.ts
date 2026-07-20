import { IsEnum } from "class-validator";
import { SalesOrderStatus } from "@mantra-os/db";

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus)
  status!: SalesOrderStatus;
}
