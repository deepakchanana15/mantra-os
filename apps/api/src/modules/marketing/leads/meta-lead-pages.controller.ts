import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateMetaLeadPageDto } from "./dto/create-meta-lead-page.dto";
import { MetaLeadPagesService } from "./meta-lead-pages.service";

@Controller("v1/meta-lead-pages")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class MetaLeadPagesController {
  constructor(private readonly pages: MetaLeadPagesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.META_LEAD_PAGES_READ)
  findAll() {
    return this.pages.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.META_LEAD_PAGES_CREATE)
  create(@Body() dto: CreateMetaLeadPageDto) {
    return this.pages.create(dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.META_LEAD_PAGES_DELETE)
  async remove(@Param("id") id: string) {
    await this.pages.remove(id);
  }
}
