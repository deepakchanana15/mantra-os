import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@Controller("v1/suppliers")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SUPPLIERS_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.suppliers.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.SUPPLIERS_READ)
  findOne(@Param("id") id: string) {
    return this.suppliers.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SUPPLIERS_CREATE)
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.SUPPLIERS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.SUPPLIERS_DELETE)
  remove(@Param("id") id: string) {
    return this.suppliers.remove(id);
  }
}
