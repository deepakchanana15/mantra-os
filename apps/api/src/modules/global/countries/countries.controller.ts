import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";
import { CountriesService } from "./countries.service";

@Controller("v1/countries")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CountriesController {
  constructor(private readonly countries: CountriesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COUNTRIES_READ)
  findAll(@Query("companyId") companyId?: string) {
    return this.countries.findAll(companyId);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.COUNTRIES_READ)
  findOne(@Param("id") id: string) {
    return this.countries.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.COUNTRIES_CREATE)
  create(@Body() dto: CreateCountryDto) {
    return this.countries.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.COUNTRIES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateCountryDto) {
    return this.countries.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.COUNTRIES_DELETE)
  remove(@Param("id") id: string) {
    return this.countries.remove(id);
  }
}
