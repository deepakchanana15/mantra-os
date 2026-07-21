import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { CompaniesService } from "./companies.service";

@Controller("v1/companies")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COMPANIES_READ)
  findAll() {
    return this.companies.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.COMPANIES_READ)
  findOne(@Param("id") id: string) {
    return this.companies.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.COMPANIES_CREATE)
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.COMPANIES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.COMPANIES_DELETE)
  remove(@Param("id") id: string) {
    return this.companies.remove(id);
  }
}
