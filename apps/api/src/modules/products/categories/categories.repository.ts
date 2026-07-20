import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesRepository extends BaseRepository {
  findAll() {
    return this.db.category.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const category = await this.db.category.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.db.category.create({
      data: {
        name: dto.name,
        parentId: dto.parentId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrThrow(id);
    return this.db.category.update({
      where: { id },
      data: { name: dto.name, parentId: dto.parentId, updatedBy: this.userId },
    });
  }

  softDelete(id: string) {
    return this.db.category.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
