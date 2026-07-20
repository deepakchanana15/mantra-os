import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersRepository } from "./suppliers.repository";

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliers: SuppliersRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; search?: string }) {
    return this.suppliers.findAll(params);
  }

  findOne(id: string) {
    return this.suppliers.findOneOrThrow(id);
  }

  create(dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  update(id: string, dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  async remove(id: string) {
    const supplier = await this.suppliers.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Supplier",
      entityId: id,
      entityCreatedBy: supplier.createdBy,
      softDelete: () => this.suppliers.softDelete(id),
    });
  }
}
