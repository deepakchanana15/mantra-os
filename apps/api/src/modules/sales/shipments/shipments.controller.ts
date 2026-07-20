import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { ShipmentsService } from "./shipments.service";

class ListShipmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;
}

@Controller("v1/shipments")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SHIPMENTS_READ)
  findAll(@Query() query: ListShipmentsQueryDto) {
    return this.shipments.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.SHIPMENTS_READ)
  findOne(@Param("id") id: string) {
    return this.shipments.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SHIPMENTS_CREATE)
  create(@Body() dto: CreateShipmentDto) {
    return this.shipments.create(dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.SHIPMENTS_DELETE)
  remove(@Param("id") id: string) {
    return this.shipments.remove(id);
  }
}
