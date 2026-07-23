import { Injectable, NotFoundException } from "@nestjs/common";
import { addressToJson } from "../../../common/dto/address.dto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { SupplierPhoneInputDto } from "./dto/supplier-phone-input.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

/** The isPrimary phone if one's marked, else the first — kept in sync onto the legacy `phone` column so existing displays/exports keep working. */
function derivePrimaryNumber(phones: SupplierPhoneInputDto[] | undefined): string | undefined {
  if (!phones || phones.length === 0) return undefined;
  return (phones.find((p) => p.isPrimary) ?? phones[0]).number;
}

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
      include: { phones: { orderBy: { isPrimary: "desc" } } },
    });
    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const supplier = await this.db.supplier.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? derivePrimaryNumber(dto.phones),
        address: addressToJson(dto.address),
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
    if (dto.phones?.length) {
      await this.db.supplierPhone.createMany({
        data: dto.phones.map((p) => ({
          organizationId: this.organizationId,
          supplierId: supplier.id,
          label: p.label,
          number: p.number,
          isPrimary: p.isPrimary ?? false,
        })),
      });
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOneOrThrow(id);
    const supplier = await this.db.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? derivePrimaryNumber(dto.phones),
        address: addressToJson(dto.address),
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
    if (dto.phones) {
      await this.db.supplierPhone.deleteMany({ where: { supplierId: id } });
      if (dto.phones.length) {
        await this.db.supplierPhone.createMany({
          data: dto.phones.map((p) => ({
            organizationId: this.organizationId,
            supplierId: id,
            label: p.label,
            number: p.number,
            isPrimary: p.isPrimary ?? false,
          })),
        });
      }
    }
    return supplier;
  }

  softDelete(id: string) {
    return this.db.supplier.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
