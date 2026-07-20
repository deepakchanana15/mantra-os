import { Controller, Get, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../common/permissions/permission-keys";
import { ReportsService } from "./reports.service";

@Controller("v1/reports")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("dashboard")
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  getDashboardSummary() {
    return this.reports.getDashboardSummary();
  }
}
