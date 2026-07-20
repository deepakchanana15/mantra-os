import { BadRequestException, Injectable } from "@nestjs/common";
import { CampaignStatus } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { ResendService } from "../../notifications/resend/resend.service";
import { SegmentsRepository } from "../segments/segments.repository";
import { CampaignsRepository } from "./campaigns.repository";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly campaigns: CampaignsRepository,
    private readonly segments: SegmentsRepository,
    private readonly resend: ResendService,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.campaigns.findAll();
  }

  findOne(id: string) {
    return this.campaigns.findOneOrThrow(id);
  }

  create(dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  /**
   * The one real send path for V1 — one Segment, one Template, sent
   * immediately via Resend to every resolved recipient. No batching/rate
   * limiting beyond what Resend itself does; revisit if Marketing needs to
   * send at a volume where that matters, not speculatively now.
   */
  async send(id: string) {
    const campaign = await this.campaigns.findOneOrThrow(id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException(`Campaign is already ${campaign.status.toLowerCase()}`);
    }

    const recipients = await this.segments.resolveRecipientEmails(campaign.segmentId);

    await Promise.all(
      recipients.map((to) =>
        this.resend.sendEmail({ to, subject: campaign.template.subject, html: campaign.template.bodyHtml }),
      ),
    );

    return this.campaigns.updateSendResult(id, {
      status: CampaignStatus.SENT,
      sentAt: new Date(),
      stats: { sent: recipients.length },
    });
  }

  async remove(id: string) {
    const campaign = await this.campaigns.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Campaign",
      entityId: id,
      entityCreatedBy: campaign.createdBy,
      softDelete: () => this.campaigns.softDelete(id),
    });
  }
}
