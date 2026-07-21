import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";

@Injectable()
export class CountriesRepository extends BaseRepository {
  findAll(params: { companyId?: string }) {
    return this.db.country.findMany({
      where: { organizationId: this.organizationId, deletedAt: null, ...(params.companyId ? { companyId: params.companyId } : {}) },
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const country = await this.db.country.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { warehouses: { where: { deletedAt: null } } },
    });
    if (!country) {
      throw new NotFoundException("Country not found");
    }
    return country;
  }

  create(dto: CreateCountryDto) {
    return this.db.country.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        isoCode: dto.isoCode,
        currencyId: dto.currencyId,
        defaultLanguage: dto.defaultLanguage,
        timeZone: dto.timeZone,
        dateFormat: dto.dateFormat,
        taxPercentage: dto.taxPercentage,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOneOrThrow(id);
    return this.db.country.update({
      where: { id },
      data: {
        name: dto.name,
        isoCode: dto.isoCode,
        currencyId: dto.currencyId,
        defaultLanguage: dto.defaultLanguage,
        timeZone: dto.timeZone,
        dateFormat: dto.dateFormat,
        taxPercentage: dto.taxPercentage,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.country.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
