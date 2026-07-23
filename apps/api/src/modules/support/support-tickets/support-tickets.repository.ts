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
      include: { customer: true, assignedTo: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const ticket = await this.db.supportTicket.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true, assignedTo: true },
    });
    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }
    return ticket;
  }

  /** Lightweight org-member list for the assignee picker — name only, not the full Members management view (that stays Owner/Admin-only). */
  async listAssignableMembers() {
    const memberships = await this.db.membership.findMany({
      where: { organizationId: this.organizationId },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });
    return memberships.map((m) => ({ id: m.user.id, name: m.user.name }));
  }

  private async assertAssigneeIsMember(assignedToId: string | undefined) {
    if (!assignedToId) return;
    const membership = await this.db.membership.findFirst({
      where: { organizationId: this.organizationId, userId: assignedToId },
    });
    if (!membership) {
      throw new NotFoundException("Assignee is not a member of this organization");
    }
  }

  async create(dto: CreateSupportTicketDto) {
    await this.assertAssigneeIsMember(dto.assignedToId);
    const dueAt = dto.slaHours ? new Date(Date.now() + dto.slaHours * 60 * 60 * 1000) : undefined;
    return this.db.supportTicket.create({
      data: {
        customerId: dto.customerId,
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        slaHours: dto.slaHours,
        dueAt,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateSupportTicketDto) {
    const existing = await this.findOneOrThrow(id);
    await this.assertAssigneeIsMember(dto.assignedToId);
    const slaChanged = dto.slaHours !== undefined && dto.slaHours !== existing.slaHours;
    const dueAt = slaChanged ? new Date(existing.createdAt.getTime() + dto.slaHours! * 60 * 60 * 1000) : undefined;
    return this.db.supportTicket.update({
      where: { id },
      data: {
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        slaHours: dto.slaHours,
        ...(slaChanged ? { dueAt } : {}),
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
