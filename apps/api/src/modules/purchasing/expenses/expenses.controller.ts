import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

class ListExpensesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  goodsReceiptId?: string;
}

@Controller("v1/expenses")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  findAll(@Query() query: ListExpensesQueryDto) {
    return this.expenses.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  findOne(@Param("id") id: string) {
    return this.expenses.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.EXPENSES_CREATE)
  create(@Body() dto: CreateExpenseDto) {
    return this.expenses.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.EXPENSES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenses.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.EXPENSES_DELETE)
  remove(@Param("id") id: string) {
    return this.expenses.remove(id);
  }
}
