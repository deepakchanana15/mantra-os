import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";
import { CountriesRepository } from "./countries.repository";

@Injectable()
export class CountriesService {
  constructor(
    private readonly countries: CountriesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(companyId?: string) {
    return this.countries.findAll({ companyId });
  }

  findOne(id: string) {
    return this.countries.findOneOrThrow(id);
  }

  create(dto: CreateCountryDto) {
    return this.countries.create(dto);
  }

  update(id: string, dto: UpdateCountryDto) {
    return this.countries.update(id, dto);
  }

  async remove(id: string) {
    const country = await this.countries.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Country",
      entityId: id,
      entityCreatedBy: country.createdBy,
      softDelete: () => this.countries.softDelete(id),
    });
  }
}
