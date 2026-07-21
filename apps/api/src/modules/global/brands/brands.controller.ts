import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { BrandsService } from "./brands.service";

@Controller("v1/brands")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.BRANDS_READ)
  findAll() {
    return this.brands.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.BRANDS_READ)
  findOne(@Param("id") id: string) {
    return this.brands.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.BRANDS_CREATE)
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.BRANDS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.BRANDS_DELETE)
  remove(@Param("id") id: string) {
    return this.brands.remove(id);
  }
}
