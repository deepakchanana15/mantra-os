import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { MembershipsService } from "./memberships.service";

/**
 * Membership management (who's in the org, what role they hold) is gated by
 * the base "Users & Roles" permission bundle (Owner/Admin only — see
 * ARCHITECTURE.md's RBAC matrix), not by DeletionGuardService. The
 * Owner-delegated deletion-grant system is specifically for business
 * records (Customers, Orders, Products, ...) — removing a colleague from
 * the org is a different kind of action, governed by role alone.
 */
@Controller("v1/members")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  findAll() {
    return this.memberships.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.MEMBERS_CREATE)
  create(@Body() dto: CreateMemberDto) {
    return this.memberships.create(dto);
  }

  @Patch(":id/role")
  @RequirePermission(PERMISSIONS.MEMBERS_UPDATE)
  updateRole(@Param("id") id: string, @Body() dto: UpdateMemberRoleDto) {
    return this.memberships.updateRole(id, dto.roleKey);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.MEMBERS_DELETE)
  remove(@Param("id") id: string) {
    return this.memberships.remove(id);
  }
}
