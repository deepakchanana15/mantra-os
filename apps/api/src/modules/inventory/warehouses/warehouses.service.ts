import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { WarehousesRepository } from "./warehouses.repository";

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehouses: WarehousesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.warehouses.findAll();
  }

  findOne(id: string) {
    return this.warehouses.findOneOrThrow(id);
  }

  create(dto: CreateWarehouseDto) {
    return this.warehouses.create(dto);
  }

  update(id: string, dto: UpdateWarehouseDto) {
    return this.warehouses.update(id, dto);
  }

  async remove(id: string) {
    const warehouse = await this.warehouses.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Warehouse",
      entityId: id,
      entityCreatedBy: warehouse.createdBy,
      softDelete: () => this.warehouses.softDelete(id),
    });
  }
}
