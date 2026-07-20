import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class NotificationsRepository extends BaseRepository {
  findOwners() {
    return this.db.membership.findMany({
      where: { organizationId: this.organizationId, role: { key: "owner" } },
      include: { user: true },
    });
  }

  create(data: { userId: string; type: string; title: string; body?: string; metadata?: object }) {
    return this.db.notification.create({
      data: {
        organizationId: this.organizationId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: data.metadata,
      },
    });
  }

  findAllForUser(userId: string) {
    return this.db.notification.findMany({
      where: { organizationId: this.organizationId, userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  markRead(notificationId: string, userId: string) {
    return this.db.notification.updateMany({
      where: { id: notificationId, organizationId: this.organizationId, userId },
      data: { readAt: new Date() },
    });
  }
}
