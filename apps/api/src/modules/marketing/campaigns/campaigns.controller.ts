import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@Controller("v1/campaigns")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CAMPAIGNS_READ)
  findAll() {
    return this.campaigns.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.CAMPAIGNS_READ)
  findOne(@Param("id") id: string) {
    return this.campaigns.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CAMPAIGNS_CREATE)
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Post(":id/send")
  @RequirePermission(PERMISSIONS.CAMPAIGNS_SEND)
  send(@Param("id") id: string) {
    return this.campaigns.send(id);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.CAMPAIGNS_DELETE)
  remove(@Param("id") id: string) {
    return this.campaigns.remove(id);
  }
}
