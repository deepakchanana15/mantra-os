import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CampaignsController } from "./campaigns/campaigns.controller";
import { CampaignsRepository } from "./campaigns/campaigns.repository";
import { CampaignsService } from "./campaigns/campaigns.service";
import { EmailTemplatesController } from "./email-templates/email-templates.controller";
import { EmailTemplatesRepository } from "./email-templates/email-templates.repository";
import { EmailTemplatesService } from "./email-templates/email-templates.service";
import { IntegrationsController } from "./integrations/integrations.controller";
import { IntegrationsRepository } from "./integrations/integrations.repository";
import { IntegrationsService } from "./integrations/integrations.service";
import { MetaAdsService } from "./integrations/meta-ads.service";
import { SyncCronController } from "./integrations/sync-cron.controller";
import { SegmentsController } from "./segments/segments.controller";
import { SegmentsRepository } from "./segments/segments.repository";
import { SegmentsService } from "./segments/segments.service";

@Module({
  imports: [NotificationsModule],
  controllers: [
    SegmentsController,
    EmailTemplatesController,
    CampaignsController,
    IntegrationsController,
    SyncCronController,
  ],
  providers: [
    SegmentsRepository,
    SegmentsService,
    EmailTemplatesRepository,
    EmailTemplatesService,
    CampaignsRepository,
    CampaignsService,
    IntegrationsRepository,
    IntegrationsService,
    MetaAdsService,
  ],
})
export class MarketingModule {}
