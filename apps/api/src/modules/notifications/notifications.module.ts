import { Module } from "@nestjs/common";
import { BrevoWebhookController } from "./brevo/brevo-webhook.controller";
import { BrevoService } from "./brevo/brevo.service";
import { RecordDeletedListener } from "./listeners/record-deleted.listener";
import { NotificationsController } from "./notifications.controller";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController, BrevoWebhookController],
  providers: [NotificationsRepository, NotificationsService, BrevoService, RecordDeletedListener],
  exports: [BrevoService],
})
export class NotificationsModule {}
