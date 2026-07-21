import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { WebsitesService } from "./websites.service";

@Controller("v1/websites")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class WebsitesController {
  constructor(private readonly websites: WebsitesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.WEBSITES_READ)
  findAll() {
    return this.websites.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.WEBSITES_READ)
  findOne(@Param("id") id: string) {
    return this.websites.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.WEBSITES_CREATE)
  create(@Body() dto: CreateWebsiteDto) {
    return this.websites.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.WEBSITES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateWebsiteDto) {
    return this.websites.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.WEBSITES_DELETE)
  remove(@Param("id") id: string) {
    return this.websites.remove(id);
  }
}
