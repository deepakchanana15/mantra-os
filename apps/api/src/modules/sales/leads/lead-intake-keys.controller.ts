import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateLeadIntakeKeyDto } from "./dto/create-lead-intake-key.dto";
import { LeadIntakeKeysService } from "./lead-intake-keys.service";

@Controller("v1/lead-intake-keys")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class LeadIntakeKeysController {
  constructor(private readonly keys: LeadIntakeKeysService) {}

  @Get()
  @RequirePermission(PERMISSIONS.LEAD_INTAKE_KEYS_READ)
  findAll() {
    return this.keys.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.LEAD_INTAKE_KEYS_CREATE)
  create(@Body() dto: CreateLeadIntakeKeyDto) {
    return this.keys.create(dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.LEAD_INTAKE_KEYS_DELETE)
  async remove(@Param("id") id: string) {
    await this.keys.remove(id);
  }
}
