import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";

@Injectable()
export class CompaniesRepository extends BaseRepository {
  findAll() {
    return this.db.company.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const company = await this.db.company.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { countries: { where: { deletedAt: null } } },
    });
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company;
  }

  create(dto: CreateCompanyDto) {
    return this.db.company.create({
      data: {
        name: dto.name,
        legalName: dto.legalName,
        registrationNumber: dto.registrationNumber,
        baseCurrencyId: dto.baseCurrencyId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOneOrThrow(id);
    return this.db.company.update({
      where: { id },
      data: {
        name: dto.name,
        legalName: dto.legalName,
        registrationNumber: dto.registrationNumber,
        baseCurrencyId: dto.baseCurrencyId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.company.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
