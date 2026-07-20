import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { UpdateSalesOrderStatusDto } from "./dto/update-sales-order-status.dto";
import { SalesOrdersService } from "./sales-orders.service";

class ListSalesOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

@Controller("v1/sales-orders")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrders: SalesOrdersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SALES_ORDERS_READ)
  findAll(@Query() query: ListSalesOrdersQueryDto) {
    return this.salesOrders.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.SALES_ORDERS_READ)
  findOne(@Param("id") id: string) {
    return this.salesOrders.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SALES_ORDERS_CREATE)
  create(@Body() dto: CreateSalesOrderDto) {
    return this.salesOrders.create(dto);
  }

  @Patch(":id/status")
  @RequirePermission(PERMISSIONS.SALES_ORDERS_UPDATE)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateSalesOrderStatusDto) {
    return this.salesOrders.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.SALES_ORDERS_DELETE)
  remove(@Param("id") id: string) {
    return this.salesOrders.remove(id);
  }
}
