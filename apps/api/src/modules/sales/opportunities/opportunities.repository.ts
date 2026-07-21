import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";

@Injectable()
export class OpportunitiesRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.db.opportunity.findMany({
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
    const opportunity = await this.db.opportunity.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true },
    });
    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }
    return opportunity;
  }

  create(dto: CreateOpportunityDto) {
    return this.db.opportunity.create({
      data: {
        customerId: dto.customerId,
        name: dto.name,
        stage: dto.stage,
        estimatedValue: dto.estimatedValue,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    await this.findOneOrThrow(id);
    return this.db.opportunity.update({
      where: { id },
      data: {
        name: dto.name,
        stage: dto.stage,
        estimatedValue: dto.estimatedValue,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.opportunity.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
