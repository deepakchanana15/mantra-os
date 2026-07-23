import { BadRequestException, Injectable } from "@nestjs/common";
import { CampaignStatus } from "@mantra-os/db";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { BrevoService } from "../../notifications/brevo/brevo.service";
import { SegmentsRepository } from "../segments/segments.repository";
import { CampaignsRepository } from "./campaigns.repository";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly campaigns: CampaignsRepository,
    private readonly segments: SegmentsRepository,
    private readonly brevo: BrevoService,
    private readonly deletionGuard: DeletionGuardService,
    private readonly tenantContext: TenantContextService,
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
   * immediately via Brevo to every resolved recipient. No batching/rate
   * limiting beyond what Brevo itself does; revisit if Marketing needs to
   * send at a volume where that matters, not speculatively now.
   *
   * Each send is tagged `campaign:<id>` — Brevo echoes `tags` back on every
   * webhook event (delivered/opened/clicked/bounced), which is how
   * `/v1/webhooks/brevo` matches an event back to this Campaign's stats.
   * `delivered`/`opened`/`clicked`/`bounced` start at 0 here and are filled
   * in asynchronously as those webhook events arrive.
   */
  async send(id: string) {
    const campaign = await this.campaigns.findOneOrThrow(id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException(`Campaign is already ${campaign.status.toLowerCase()}`);
    }

    const recipients = await this.segments.resolveRecipientEmails(campaign.segmentId);

    const results = await Promise.all(
      recipients.map((to) =>
        this.brevo.sendEmail({
          to,
          subject: campaign.template.subject,
          html: campaign.template.bodyHtml,
          tags: [`campaign:${id}`, `org:${this.tenantContext.organizationId}`],
        }),
      ),
    );
    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;

    if (sent === 0 && recipients.length > 0) {
      throw new BadRequestException("Couldn't send to any recipients — check the Brevo connection and try again");
    }

    return this.campaigns.updateSendResult(id, {
      status: CampaignStatus.SENT,
      sentAt: new Date(),
      stats: { sent, failed, delivered: 0, opened: 0, clicked: 0, bounced: 0 },
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
