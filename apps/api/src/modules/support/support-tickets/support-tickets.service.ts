import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { SupportTicketsRepository } from "./support-tickets.repository";

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly tickets: SupportTicketsRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.tickets.findAll(params);
  }

  findOne(id: string) {
    return this.tickets.findOneOrThrow(id);
  }

  listAssignableMembers() {
    return this.tickets.listAssignableMembers();
  }

  create(dto: CreateSupportTicketDto) {
    return this.tickets.create(dto);
  }

  update(id: string, dto: UpdateSupportTicketDto) {
    return this.tickets.update(id, dto);
  }

  async remove(id: string) {
    const ticket = await this.tickets.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "SupportTicket",
      entityId: id,
      entityCreatedBy: ticket.createdBy,
      softDelete: () => this.tickets.softDelete(id),
    });
  }
}
