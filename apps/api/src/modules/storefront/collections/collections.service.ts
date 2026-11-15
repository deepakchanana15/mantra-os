import { Injectable } from "@nestjs/common";
import { CollectionsRepository } from "./collections.repository";
import { AddCollectionProductDto } from "./dto/add-collection-product.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionsService {
  constructor(private readonly collections: CollectionsRepository) {}

  findAll(siteId: string) {
    return this.collections.findAll(siteId);
  }

  findOne(siteId: string, id: string) {
    return this.collections.findOneOrThrow(siteId, id);
  }

  create(siteId: string, dto: CreateCollectionDto) {
    return this.collections.create(siteId, dto);
  }

  update(siteId: string, id: string, dto: UpdateCollectionDto) {
    return this.collections.update(siteId, id, dto);
  }

  remove(siteId: string, id: string) {
    return this.collections.remove(siteId, id);
  }

  addProduct(siteId: string, id: string, dto: AddCollectionProductDto) {
    return this.collections.addProduct(siteId, id, dto.productId, dto.sortOrder);
  }

  removeProduct(siteId: string, id: string, productId: string) {
    return this.collections.removeProduct(siteId, id, productId);
  }
}
