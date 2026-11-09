import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { AuditLogRepository } from "../../activity/audit-log/audit-log.repository";
import { CreateNoteDto } from "../../activity/notes/dto/create-note.dto";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { OpportunitiesRepository } from "./opportunities.repository";

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly opportunities: OpportunitiesRepository,
    private readonly deletionGuard: DeletionGuardService,
    private readonly auditLog: AuditLogRepository,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.opportunities.findAll(params);
  }

  async findOne(id: string) {
    const opportunity = await this.opportunities.findOneOrThrow(id);
    await this.auditLog.record({ entityType: "OPPORTUNITY", entityId: id, action: "VIEWED" });
    return opportunity;
  }

  findActivity(id: string) {
    return this.opportunities.findActivity(id);
  }

  findViews(id: string) {
    return this.opportunities.findViews(id);
  }

  addNote(id: string, dto: CreateNoteDto) {
    return this.opportunities.addNote(id, dto.body);
  }

  create(dto: CreateOpportunityDto) {
    return this.opportunities.create(dto);
  }

  update(id: string, dto: UpdateOpportunityDto) {
    return this.opportunities.update(id, dto);
  }

  async remove(id: string) {
    const opportunity = await this.opportunities.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Opportunity",
      entityId: id,
      entityCreatedBy: opportunity.createdBy,
      softDelete: () => this.opportunities.softDelete(id),
    });
  }

  convertToCustomer(id: string) {
    return this.opportunities.convertToCustomer(id);
  }
}
