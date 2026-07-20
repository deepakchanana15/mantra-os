import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; search?: string; categoryId?: string }) {
    return this.products.findAll(params);
  }

  findOne(id: string) {
    return this.products.findOneOrThrow(id);
  }

  create(dto: CreateProductDto) {
    return this.products.create(dto);
  }

  update(id: string, dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  async remove(id: string) {
    const product = await this.products.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Product",
      entityId: id,
      entityCreatedBy: product.createdBy,
      softDelete: () => this.products.softDelete(id),
    });
  }
}
