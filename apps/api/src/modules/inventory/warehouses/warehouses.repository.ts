import { Injectable, NotFoundException } from "@nestjs/common";
import { addressToJson } from "../../../common/dto/address.dto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Injectable()
export class WarehousesRepository extends BaseRepository {
  findAll() {
    return this.db.warehouse.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const warehouse = await this.db.warehouse.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException("Warehouse not found");
    }
    return warehouse;
  }

  create(dto: CreateWarehouseDto) {
    return this.db.warehouse.create({
      data: {
        name: dto.name,
        address: addressToJson(dto.address),
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOneOrThrow(id);
    return this.db.warehouse.update({
      where: { id },
      data: { name: dto.name, address: addressToJson(dto.address), updatedBy: this.userId },
    });
  }

  softDelete(id: string) {
    return this.db.warehouse.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
