import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CampaignsController } from "./campaigns/campaigns.controller";
import { CampaignsRepository } from "./campaigns/campaigns.repository";
import { CampaignsService } from "./campaigns/campaigns.service";
import { EmailTemplatesController } from "./email-templates/email-templates.controller";
import { EmailTemplatesRepository } from "./email-templates/email-templates.repository";
import { EmailTemplatesService } from "./email-templates/email-templates.service";
import { SegmentsController } from "./segments/segments.controller";
import { SegmentsRepository } from "./segments/segments.repository";
import { SegmentsService } from "./segments/segments.service";

@Module({
  imports: [NotificationsModule],
  controllers: [SegmentsController, EmailTemplatesController, CampaignsController],
  providers: [
    SegmentsRepository,
    SegmentsService,
    EmailTemplatesRepository,
    EmailTemplatesService,
    CampaignsRepository,
    CampaignsService,
  ],
})
export class MarketingModule {}
