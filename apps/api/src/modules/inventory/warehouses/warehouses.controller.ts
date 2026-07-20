import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { WarehousesService } from "./warehouses.service";

@Controller("v1/warehouses")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.WAREHOUSES_READ)
  findAll() {
    return this.warehouses.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.WAREHOUSES_READ)
  findOne(@Param("id") id: string) {
    return this.warehouses.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.WAREHOUSES_CREATE)
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouses.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.WAREHOUSES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouses.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.WAREHOUSES_DELETE)
  remove(@Param("id") id: string) {
    return this.warehouses.remove(id);
  }
}
