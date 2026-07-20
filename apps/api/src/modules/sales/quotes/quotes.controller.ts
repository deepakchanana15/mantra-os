import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { UpdateQuoteStatusDto } from "./dto/update-quote-status.dto";
import { QuotesService } from "./quotes.service";

class ListQuotesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

@Controller("v1/quotes")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.QUOTES_READ)
  findAll(@Query() query: ListQuotesQueryDto) {
    return this.quotes.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.QUOTES_READ)
  findOne(@Param("id") id: string) {
    return this.quotes.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.QUOTES_CREATE)
  create(@Body() dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  @Patch(":id/status")
  @RequirePermission(PERMISSIONS.QUOTES_UPDATE)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.quotes.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.QUOTES_DELETE)
  remove(@Param("id") id: string) {
    return this.quotes.remove(id);
  }
}
