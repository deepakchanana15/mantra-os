import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; search?: string; categoryId?: string }) {
    const where: Prisma.ProductWhereInput = {
      organizationId: this.organizationId,
      deletedAt: null,
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    };
    return this.db.product.findMany({
      where,
      include: { category: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const product = await this.db.product.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.db.product.findUnique({
      where: { organizationId_sku: { organizationId: this.organizationId, sku: dto.sku } },
    });
    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }
    return this.db.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        unitPrice: dto.unitPrice,
        unitCost: dto.unitCost,
        brandId: dto.brandId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOneOrThrow(id);
    return this.db.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        unitPrice: dto.unitPrice,
        unitCost: dto.unitCost,
        brandId: dto.brandId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.product.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
