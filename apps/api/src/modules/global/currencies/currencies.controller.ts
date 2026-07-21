import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { CurrenciesService } from "./currencies.service";

/** Read-only — global ISO 4217 reference data seeded by the platform, not user-managed in V1. */
@Controller("v1/currencies")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CurrenciesController {
  constructor(private readonly currencies: CurrenciesService) {}

  @Get()
  findAll() {
    return this.currencies.findAll();
  }
}
