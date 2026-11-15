import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateStorefrontSiteDto } from "./dto/create-storefront-site.dto";
import { UpdateStorefrontSiteDto } from "./dto/update-storefront-site.dto";
import { StorefrontSitesService } from "./storefront-sites.service";

@Controller("v1/storefront/sites")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class StorefrontSitesController {
  constructor(private readonly sites: StorefrontSitesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_SITES_READ)
  findAll() {
    return this.sites.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_SITES_READ)
  findOne(@Param("id") id: string) {
    return this.sites.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.STOREFRONT_SITES_CREATE)
  create(@Body() dto: CreateStorefrontSiteDto) {
    return this.sites.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_SITES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateStorefrontSiteDto) {
    return this.sites.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_SITES_DELETE)
  async remove(@Param("id") id: string) {
    await this.sites.remove(id);
  }
}
