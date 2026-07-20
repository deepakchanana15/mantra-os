import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { User } from "@mantra-os/db";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("v1/organizations")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @SkipTenantContext()
  listMine(@CurrentUser() user: User) {
    return this.organizations.listForUser(user.id);
  }

  @Get("me")
  getCurrent() {
    return this.organizations.getCurrent();
  }

  @Patch("me")
  @RequirePermission(PERMISSIONS.ORG_SETTINGS_UPDATE)
  updateCurrent(@Body() dto: UpdateOrganizationDto) {
    return this.organizations.updateCurrent(dto);
  }
}
