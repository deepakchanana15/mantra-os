import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { addressToJson } from "../../../common/dto/address.dto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; search?: string }) {
    const where: Prisma.CustomerWhereInput = {
      organizationId: this.organizationId,
      deletedAt: null,
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
    };
    return this.db.customer.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const customer = await this.db.customer.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { contacts: { where: { deletedAt: null } } },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  create(dto: CreateCustomerDto) {
    return this.db.customer.create({
      data: {
        name: dto.name,
        type: dto.type,
        companyId: dto.companyId,
        countryId: dto.countryId,
        email: dto.email,
        phone: dto.phone,
        billingAddress: addressToJson(dto.billingAddress),
        shippingAddress: addressToJson(dto.shippingAddress),
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOneOrThrow(id);
    return this.db.customer.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        companyId: dto.companyId,
        countryId: dto.countryId,
        email: dto.email,
        phone: dto.phone,
        billingAddress: addressToJson(dto.billingAddress),
        shippingAddress: addressToJson(dto.shippingAddress),
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.customer.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: this.userId },
    });
  }
}
