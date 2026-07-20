import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

@Controller("v1/products")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  findAll(@Query() query: ListProductsQueryDto) {
    return this.products.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  findOne(@Param("id") id: string) {
    return this.products.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PRODUCTS_CREATE)
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.PRODUCTS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.PRODUCTS_DELETE)
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
