import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoriesRepository } from "./categories.repository";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.categories.findAll();
  }

  findOne(id: string) {
    return this.categories.findOneOrThrow(id);
  }

  create(dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  async remove(id: string) {
    const category = await this.categories.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Category",
      entityId: id,
      entityCreatedBy: category.createdBy,
      softDelete: () => this.categories.softDelete(id),
    });
  }
}
