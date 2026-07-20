import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";
import { UpdateEmailTemplateDto } from "./dto/update-email-template.dto";
import { EmailTemplatesService } from "./email-templates.service";

@Controller("v1/email-templates")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class EmailTemplatesController {
  constructor(private readonly templates: EmailTemplatesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EMAIL_TEMPLATES_READ)
  findAll() {
    return this.templates.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.EMAIL_TEMPLATES_READ)
  findOne(@Param("id") id: string) {
    return this.templates.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.EMAIL_TEMPLATES_CREATE)
  create(@Body() dto: CreateEmailTemplateDto) {
    return this.templates.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.EMAIL_TEMPLATES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.templates.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.EMAIL_TEMPLATES_DELETE)
  remove(@Param("id") id: string) {
    return this.templates.remove(id);
  }
}
