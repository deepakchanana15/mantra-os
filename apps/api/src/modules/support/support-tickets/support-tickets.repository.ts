import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";

@Injectable()
export class SupportTicketsRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.db.supportTicket.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
      },
      include: { customer: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const ticket = await this.db.supportTicket.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true },
    });
    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }
    return ticket;
  }

  create(dto: CreateSupportTicketDto) {
    return this.db.supportTicket.create({
      data: {
        customerId: dto.customerId,
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateSupportTicketDto) {
    await this.findOneOrThrow(id);
    return this.db.supportTicket.update({
      where: { id },
      data: {
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.supportTicket.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
