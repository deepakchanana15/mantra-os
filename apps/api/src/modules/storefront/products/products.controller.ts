import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductImageDto } from "./dto/create-product-image.dto";
import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { ListProductsQueryDto } from "./dto/list-products-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { ProductsService } from "./products.service";

@Controller("v1/storefront/sites/:siteId/products")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAll(@Param("siteId") siteId: string, @Query() query: ListProductsQueryDto) {
    return this.products.findAll(siteId, query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findOne(@Param("siteId") siteId: string, @Param("id") id: string) {
    return this.products.findOne(siteId, id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  create(@Param("siteId") siteId: string, @Body() dto: CreateProductDto) {
    return this.products.create(siteId, dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  update(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(siteId, id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async remove(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.products.remove(siteId, id);
  }

  @Post(":id/variants")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  addVariant(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: CreateProductVariantDto) {
    return this.products.addVariant(siteId, id, dto);
  }

  @Patch(":id/variants/:variantId")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  updateVariant(@Param("siteId") siteId: string, @Param("variantId") variantId: string, @Body() dto: UpdateProductVariantDto) {
    return this.products.updateVariant(siteId, variantId, dto);
  }

  @Delete(":id/variants/:variantId")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removeVariant(@Param("siteId") siteId: string, @Param("variantId") variantId: string) {
    await this.products.removeVariant(siteId, variantId);
  }

  @Post(":id/images")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  addImage(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: CreateProductImageDto) {
    return this.products.addImage(siteId, id, dto);
  }

  @Delete(":id/images/:imageId")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removeImage(@Param("siteId") siteId: string, @Param("imageId") imageId: string) {
    await this.products.removeImage(siteId, imageId);
  }
}
