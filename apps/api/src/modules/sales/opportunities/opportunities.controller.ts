import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { OpportunitiesService } from "./opportunities.service";

@Controller("v1/opportunities")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.opportunities.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_READ)
  findOne(@Param("id") id: string) {
    return this.opportunities.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_CREATE)
  create(@Body() dto: CreateOpportunityDto) {
    return this.opportunities.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunities.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_DELETE)
  remove(@Param("id") id: string) {
    return this.opportunities.remove(id);
  }
}
