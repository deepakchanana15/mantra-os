import { Injectable, NotFoundException } from "@nestjs/common";
import { CampaignStatus, Prisma } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@Injectable()
export class CampaignsRepository extends BaseRepository {
  findAll() {
    return this.db.campaign.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      include: { segment: true, template: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const campaign = await this.db.campaign.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { segment: true, template: true },
    });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }
    return campaign;
  }

  create(dto: CreateCampaignDto) {
    return this.db.campaign.create({
      data: {
        segmentId: dto.segmentId,
        templateId: dto.templateId,
        scheduledAt: dto.scheduledAt,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
      include: { segment: true, template: true },
    });
  }

  async updateSendResult(id: string, params: { status: CampaignStatus; sentAt: Date; stats: Prisma.InputJsonValue }) {
    return this.db.campaign.update({
      where: { id },
      data: { status: params.status, sentAt: params.sentAt, stats: params.stats, updatedBy: this.userId },
    });
  }

  softDelete(id: string) {
    return this.db.campaign.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
