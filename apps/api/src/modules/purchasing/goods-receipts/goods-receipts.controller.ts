import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";
import { GoodsReceiptsService } from "./goods-receipts.service";

class ListGoodsReceiptsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}

/** No PATCH/DELETE — append-only, see GoodsReceiptsService. */
@Controller("v1/goods-receipts")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class GoodsReceiptsController {
  constructor(private readonly goodsReceipts: GoodsReceiptsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.GOODS_RECEIPTS_READ)
  findAll(@Query() query: ListGoodsReceiptsQueryDto) {
    return this.goodsReceipts.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.GOODS_RECEIPTS_READ)
  findOne(@Param("id") id: string) {
    return this.goodsReceipts.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.GOODS_RECEIPTS_CREATE)
  create(@Body() dto: CreateGoodsReceiptDto) {
    return this.goodsReceipts.create(dto);
  }
}
