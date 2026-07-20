import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { InventoryService } from "./inventory.service";

class StockQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

class TransactionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

/** No PATCH/DELETE anywhere here — InventoryTransaction is an immutable ledger. See DATABASE.md. */
@Controller("v1/inventory")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("stock")
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  findStock(@Query() query: StockQueryDto) {
    return this.inventory.findStockLevels(query);
  }

  @Get("transactions")
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  findTransactions(@Query() query: TransactionsQueryDto) {
    return this.inventory.findTransactions(query);
  }

  @Post("transactions")
  @RequirePermission(PERMISSIONS.INVENTORY_ADJUST)
  createAdjustment(@Body() dto: CreateAdjustmentDto) {
    return this.inventory.createAdjustment(dto);
  }
}
