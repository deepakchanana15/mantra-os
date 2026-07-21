import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { OpportunitiesRepository } from "./opportunities.repository";

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly opportunities: OpportunitiesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.opportunities.findAll(params);
  }

  findOne(id: string) {
    return this.opportunities.findOneOrThrow(id);
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
}
