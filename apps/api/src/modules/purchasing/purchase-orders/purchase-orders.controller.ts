import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { UpdatePurchaseOrderStatusDto } from "./dto/update-purchase-order-status.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

class ListPurchaseOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

@Controller("v1/purchase-orders")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PURCHASE_ORDERS_READ)
  findAll(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseOrders.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.PURCHASE_ORDERS_READ)
  findOne(@Param("id") id: string) {
    return this.purchaseOrders.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PURCHASE_ORDERS_CREATE)
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrders.create(dto);
  }

  @Patch(":id/status")
  @RequirePermission(PERMISSIONS.PURCHASE_ORDERS_UPDATE)
  updateStatus(@Param("id") id: string, @Body() dto: UpdatePurchaseOrderStatusDto) {
    return this.purchaseOrders.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.PURCHASE_ORDERS_DELETE)
  remove(@Param("id") id: string) {
    return this.purchaseOrders.remove(id);
  }
}
