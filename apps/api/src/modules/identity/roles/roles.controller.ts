import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { RolesService } from "./roles.service";

/** Read-only for V1 — no custom role builder. See ARCHITECTURE.md "RBAC scope". */
@Controller("v1/roles")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  findAll() {
    return this.roles.findAll();
  }
}
