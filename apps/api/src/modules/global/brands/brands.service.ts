import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { BrandsRepository } from "./brands.repository";

@Injectable()
export class BrandsService {
  constructor(
    private readonly brands: BrandsRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.brands.findAll();
  }

  findOne(id: string) {
    return this.brands.findOneOrThrow(id);
  }

  create(dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  update(id: string, dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  async remove(id: string) {
    const brand = await this.brands.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Brand",
      entityId: id,
      entityCreatedBy: brand.createdBy,
      softDelete: () => this.brands.softDelete(id),
    });
  }
}
