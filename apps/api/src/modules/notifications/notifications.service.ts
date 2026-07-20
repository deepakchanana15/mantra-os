import { Injectable } from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";

@Injectable()
export class NotificationsService {
  constructor(private readonly notifications: NotificationsRepository) {}

  findAllForUser(userId: string) {
    return this.notifications.findAllForUser(userId);
  }

  markRead(notificationId: string, userId: string) {
    return this.notifications.markRead(notificationId, userId);
  }
}
