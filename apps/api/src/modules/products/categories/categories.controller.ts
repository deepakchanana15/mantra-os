import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoriesService } from "./categories.service";

@Controller("v1/categories")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CATEGORIES_READ)
  findAll() {
    return this.categories.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.CATEGORIES_READ)
  findOne(@Param("id") id: string) {
    return this.categories.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CATEGORIES_CREATE)
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.CATEGORIES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.CATEGORIES_DELETE)
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}
