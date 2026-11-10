import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateNoteDto } from "../../activity/notes/dto/create-note.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "./customers.service";

@Controller("v1/customers")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.customers.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findOne(@Param("id") id: string) {
    return this.customers.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CUSTOMERS_CREATE)
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.CUSTOMERS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.CUSTOMERS_DELETE)
  remove(@Param("id") id: string) {
    return this.customers.remove(id);
  }

  @Get(":id/activity")
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findActivity(@Param("id") id: string) {
    return this.customers.findActivity(id);
  }

  @Get(":id/views")
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findViews(@Param("id") id: string) {
    return this.customers.findViews(id);
  }

  @Get(":id/views/log")
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findViewLog(@Param("id") id: string) {
    return this.customers.findViewLog(id);
  }

  @Post(":id/notes")
  @RequirePermission(PERMISSIONS.CUSTOMERS_UPDATE)
  addNote(@Param("id") id: string, @Body() dto: CreateNoteDto) {
    return this.customers.addNote(id, dto);
  }
}
