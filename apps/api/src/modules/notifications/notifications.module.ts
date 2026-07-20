import { Module } from "@nestjs/common";
import { RecordDeletedListener } from "./listeners/record-deleted.listener";
import { NotificationsController } from "./notifications.controller";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";
import { ResendService } from "./resend/resend.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsRepository, NotificationsService, ResendService, RecordDeletedListener],
  exports: [ResendService],
})
export class NotificationsModule {}
