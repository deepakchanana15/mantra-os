import { Injectable, NotFoundException } from "@nestjs/common";
import { addressToJson } from "../../../common/dto/address.dto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SuppliersRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; search?: string }) {
    return this.db.supplier.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.search ? { name: { contains: params.search, mode: "insensitive" as const } } : {}),
      },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const supplier = await this.db.supplier.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }
    return supplier;
  }

  create(dto: CreateSupplierDto) {
    return this.db.supplier.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: addressToJson(dto.address),
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOneOrThrow(id);
    return this.db.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: addressToJson(dto.address),
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.supplier.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
