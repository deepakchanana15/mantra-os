import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { CompaniesRepository } from "./companies.repository";

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companies: CompaniesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.companies.findAll();
  }

  findOne(id: string) {
    return this.companies.findOneOrThrow(id);
  }

  create(dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  update(id: string, dto: UpdateCompanyDto) {
    return this.companies.update(id, dto);
  }

  async remove(id: string) {
    const company = await this.companies.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Company",
      entityId: id,
      entityCreatedBy: company.createdBy,
      softDelete: () => this.companies.softDelete(id),
    });
  }
}
