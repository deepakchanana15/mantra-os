import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsRepository extends BaseRepository {
  findAll() {
    return this.db.brand.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const brand = await this.db.brand.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!brand) {
      throw new NotFoundException("Brand not found");
    }
    return brand;
  }

  create(dto: CreateBrandDto) {
    return this.db.brand.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOneOrThrow(id);
    return this.db.brand.update({
      where: { id },
      data: { name: dto.name, slug: dto.slug, updatedBy: this.userId },
    });
  }

  softDelete(id: string) {
    return this.db.brand.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
