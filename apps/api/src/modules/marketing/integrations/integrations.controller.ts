import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { MarketingChannel } from "@mantra-os/db";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { ConnectIntegrationDto } from "./dto/connect-integration.dto";
import { IntegrationsService } from "./integrations.service";

@Controller("v1/marketing-integrations")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MARKETING_INTEGRATIONS_READ)
  findAll() {
    return this.integrations.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.MARKETING_INTEGRATIONS_CREATE)
  connect(@Body() dto: ConnectIntegrationDto) {
    return this.integrations.connect(dto);
  }

  @Delete(":channel")
  @RequirePermission(PERMISSIONS.MARKETING_INTEGRATIONS_DELETE)
  disconnect(@Param("channel") channel: MarketingChannel) {
    return this.integrations.disconnect(channel);
  }

  @Post(":channel/sync")
  @RequirePermission(PERMISSIONS.MARKETING_INTEGRATIONS_SYNC)
  sync(@Param("channel") channel: MarketingChannel) {
    return this.integrations.sync(channel);
  }
}
