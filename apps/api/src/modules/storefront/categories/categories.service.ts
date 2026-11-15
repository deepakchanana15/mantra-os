import { Injectable } from "@nestjs/common";
import { CategoriesRepository } from "./categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  findAll(siteId: string) {
    return this.categories.findAll(siteId);
  }

  findOne(siteId: string, id: string) {
    return this.categories.findOneOrThrow(siteId, id);
  }

  create(siteId: string, dto: CreateCategoryDto) {
    return this.categories.create(siteId, dto);
  }

  update(siteId: string, id: string, dto: UpdateCategoryDto) {
    return this.categories.update(siteId, id, dto);
  }

  remove(siteId: string, id: string) {
    return this.categories.remove(siteId, id);
  }
}
