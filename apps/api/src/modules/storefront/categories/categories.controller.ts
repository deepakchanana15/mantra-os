import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("v1/storefront/sites/:siteId/categories")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAll(@Param("siteId") siteId: string) {
    return this.categories.findAll(siteId);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findOne(@Param("siteId") siteId: string, @Param("id") id: string) {
    return this.categories.findOne(siteId, id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  create(@Param("siteId") siteId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(siteId, dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  update(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(siteId, id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async remove(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.categories.remove(siteId, id);
  }
}
