import { Injectable } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductImageDto } from "./dto/create-product-image.dto";
import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductsRepository) {}

  findAll(siteId: string, params: { skip?: number; take?: number; search?: string }) {
    return this.products.findAll(siteId, params);
  }

  findOne(siteId: string, id: string) {
    return this.products.findOneOrThrow(siteId, id);
  }

  create(siteId: string, dto: CreateProductDto) {
    return this.products.create(siteId, dto);
  }

  update(siteId: string, id: string, dto: UpdateProductDto) {
    return this.products.update(siteId, id, dto);
  }

  remove(siteId: string, id: string) {
    return this.products.remove(siteId, id);
  }

  addVariant(siteId: string, productId: string, dto: CreateProductVariantDto) {
    return this.products.addVariant(siteId, productId, dto);
  }

  updateVariant(siteId: string, variantId: string, dto: UpdateProductVariantDto) {
    return this.products.updateVariant(siteId, variantId, dto);
  }

  removeVariant(siteId: string, variantId: string) {
    return this.products.removeVariant(siteId, variantId);
  }

  addImage(siteId: string, productId: string, dto: CreateProductImageDto) {
    return this.products.addImage(siteId, productId, dto);
  }

  removeImage(siteId: string, imageId: string) {
    return this.products.removeImage(siteId, imageId);
  }
}
