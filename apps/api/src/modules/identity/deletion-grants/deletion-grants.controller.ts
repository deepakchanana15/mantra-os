import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateDeletionGrantDto } from "./dto/create-deletion-grant.dto";
import { DeletionGrantsService } from "./deletion-grants.service";

/**
 * "deletion_grants:manage" is deliberately bundled into ONLY the Owner
 * system role (see the seed data referenced in TODO.md) rather than a
 * hardcoded role check here — keeps the "only the Owner can delegate
 * delete access" rule expressed through the same permission system as
 * everything else, not a special case in application code.
 */
@Controller("v1/deletion-grants")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class DeletionGrantsController {
  constructor(private readonly grants: DeletionGrantsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.DELETION_GRANTS_MANAGE)
  findAll() {
    return this.grants.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.DELETION_GRANTS_MANAGE)
  grant(@Body() dto: CreateDeletionGrantDto) {
    return this.grants.grant(dto.userId);
  }

  @Delete(":userId")
  @RequirePermission(PERMISSIONS.DELETION_GRANTS_MANAGE)
  revoke(@Param("userId") userId: string) {
    return this.grants.revoke(userId);
  }
}
