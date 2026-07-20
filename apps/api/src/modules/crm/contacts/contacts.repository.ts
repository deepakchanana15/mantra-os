import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";

@Injectable()
export class ContactsRepository extends BaseRepository {
  findAll(params: { customerId?: string; skip?: number; take?: number }) {
    return this.db.contact.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
      },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const contact = await this.db.contact.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!contact) {
      throw new NotFoundException("Contact not found");
    }
    return contact;
  }

  create(data: Omit<Prisma.ContactUncheckedCreateInput, "organizationId" | "createdBy" | "updatedBy">) {
    return this.db.contact.create({
      data: { ...data, organizationId: this.organizationId, createdBy: this.userId, updatedBy: this.userId },
    });
  }

  async update(id: string, data: Prisma.ContactUpdateInput) {
    await this.findOneOrThrow(id);
    return this.db.contact.update({ where: { id }, data: { ...data, updatedBy: this.userId } });
  }

  softDelete(id: string) {
    return this.db.contact.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
