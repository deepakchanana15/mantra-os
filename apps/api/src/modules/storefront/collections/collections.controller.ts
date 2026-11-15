import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CollectionsService } from "./collections.service";
import { AddCollectionProductDto } from "./dto/add-collection-product.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Controller("v1/storefront/sites/:siteId/collections")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAll(@Param("siteId") siteId: string) {
    return this.collections.findAll(siteId);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findOne(@Param("siteId") siteId: string, @Param("id") id: string) {
    return this.collections.findOne(siteId, id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  create(@Param("siteId") siteId: string, @Body() dto: CreateCollectionDto) {
    return this.collections.create(siteId, dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  update(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: UpdateCollectionDto) {
    return this.collections.update(siteId, id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async remove(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.collections.remove(siteId, id);
  }

  @Post(":id/products")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  addProduct(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: AddCollectionProductDto) {
    return this.collections.addProduct(siteId, id, dto);
  }

  @Delete(":id/products/:productId")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removeProduct(@Param("siteId") siteId: string, @Param("id") id: string, @Param("productId") productId: string) {
    await this.collections.removeProduct(siteId, id, productId);
  }
}
