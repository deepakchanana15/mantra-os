import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { SupportTicketsService } from "./support-tickets.service";

@Controller("v1/support-tickets")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SUPPORT_TICKETS_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.tickets.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.SUPPORT_TICKETS_READ)
  findOne(@Param("id") id: string) {
    return this.tickets.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SUPPORT_TICKETS_CREATE)
  create(@Body() dto: CreateSupportTicketDto) {
    return this.tickets.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.SUPPORT_TICKETS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.tickets.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.SUPPORT_TICKETS_DELETE)
  remove(@Param("id") id: string) {
    return this.tickets.remove(id);
  }
}
