import { Injectable, NotFoundException } from "@nestjs/common";
import { SiteConnectionManager } from "../site-connection-manager.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionsRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAll(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.collection.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findOneOrThrow(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    const collection = await client.collection.findUnique({
      where: { id },
      include: { collectionProducts: { include: { product: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (!collection) {
      throw new NotFoundException("Collection not found");
    }
    return collection;
  }

  async create(siteId: string, dto: CreateCollectionDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.collection.create({ data: { ...dto } });
  }

  async update(siteId: string, id: string, dto: UpdateCollectionDto) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    return client.collection.update({ where: { id }, data: { ...dto } });
  }

  async remove(siteId: string, id: string) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    await client.collection.delete({ where: { id } });
  }

  async addProduct(siteId: string, collectionId: string, productId: string, sortOrder?: number) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId, productId } },
      create: { collectionId, productId, sortOrder: sortOrder ?? 0 },
      update: { sortOrder: sortOrder ?? 0 },
    });
  }

  async removeProduct(siteId: string, collectionId: string, productId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    await client.collectionProduct.delete({ where: { collectionId_productId: { collectionId, productId } } });
  }
}
