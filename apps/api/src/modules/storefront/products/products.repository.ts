import { Injectable, NotFoundException } from "@nestjs/common";
import { SiteConnectionManager } from "../site-connection-manager.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductImageDto } from "./dto/create-product-image.dto";
import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";

@Injectable()
export class ProductsRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAll(siteId: string, params: { skip?: number; take?: number; search?: string }) {
    const client = await this.connections.getPrismaClient(siteId);
    const where = params.search
      ? { OR: [{ name: { contains: params.search, mode: "insensitive" as const } }, { sku: { contains: params.search, mode: "insensitive" as const } }] }
      : {};
    const [data, total] = await Promise.all([
      client.product.findMany({
        where,
        include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: params.skip ?? 0,
        take: params.take ?? 50,
      }),
      client.product.count({ where }),
    ]);
    return { data, total };
  }

  async findOneOrThrow(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    const product = await client.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async create(siteId: string, dto: CreateProductDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.product.create({ data: { ...dto } });
  }

  async update(siteId: string, id: string, dto: UpdateProductDto) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    return client.product.update({ where: { id }, data: { ...dto } });
  }

  async remove(siteId: string, id: string) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    await client.product.delete({ where: { id } });
  }

  async addVariant(siteId: string, productId: string, dto: CreateProductVariantDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.productVariant.create({ data: { ...dto, productId } });
  }

  async updateVariant(siteId: string, variantId: string, dto: UpdateProductVariantDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.productVariant.update({ where: { id: variantId }, data: { ...dto } });
  }

  async removeVariant(siteId: string, variantId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    await client.productVariant.delete({ where: { id: variantId } });
  }

  async addImage(siteId: string, productId: string, dto: CreateProductImageDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.productImage.create({ data: { ...dto, productId } });
  }

  async removeImage(siteId: string, imageId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    await client.productImage.delete({ where: { id: imageId } });
  }
}
