import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";

@Injectable()
export class WebsitesRepository extends BaseRepository {
  findAll() {
    return this.db.website.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const website = await this.db.website.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { country: true, brand: true },
    });
    if (!website) {
      throw new NotFoundException("Website not found");
    }
    return website;
  }

  create(dto: CreateWebsiteDto) {
    return this.db.website.create({
      data: {
        countryId: dto.countryId,
        brandId: dto.brandId,
        currencyId: dto.currencyId,
        language: dto.language,
        shopifyStoreId: dto.shopifyStoreId,
        domain: dto.domain,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateWebsiteDto) {
    await this.findOneOrThrow(id);
    return this.db.website.update({
      where: { id },
      data: {
        countryId: dto.countryId,
        brandId: dto.brandId,
        currencyId: dto.currencyId,
        language: dto.language,
        shopifyStoreId: dto.shopifyStoreId,
        domain: dto.domain,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.website.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
