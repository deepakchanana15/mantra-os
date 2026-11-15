import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { SettingsService } from "./settings.service";

@Controller("v1/storefront/sites/:siteId/settings")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAll(@Param("siteId") siteId: string) {
    return this.settings.findAll(siteId);
  }

  @Patch()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  update(@Param("siteId") siteId: string, @Body() dto: UpdateSettingsDto) {
    return this.settings.update(siteId, dto);
  }
}
