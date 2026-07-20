import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { RECORD_DELETED_EVENT, RecordDeletedEvent } from "../../../common/events/record-deleted.event";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsRepository } from "../notifications.repository";
import { ResendService } from "../resend/resend.service";

/**
 * Reacts to every deletion across every domain — see DECISIONS.md
 * "Deletion governance". Runs synchronously within the same request/
 * transaction that emitted the event (NestJS's EventEmitter2 default),
 * which is what lets NotificationsRepository use the same RLS-scoped
 * transaction for atomicity. If listener work ever needs to survive an
 * emitting transaction rollback, that's a queue — not needed for V1's
 * lightweight writes. See ARCHITECTURE.md "Domain events, not direct
 * coupling".
 */
@Injectable()
export class RecordDeletedListener {
  private readonly logger = new Logger(RecordDeletedListener.name);

  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly resend: ResendService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(RECORD_DELETED_EVENT)
  async handle(event: RecordDeletedEvent): Promise<void> {
    const [owners, performer] = await Promise.all([
      this.notifications.findOwners(),
      this.prisma.user.findUnique({ where: { id: event.performedById } }),
    ]);

    const title = `${performer?.name ?? "Someone"} deleted a ${event.entityType}`;

    await Promise.all(
      owners.map(async (owner) => {
        await this.notifications.create({
          userId: owner.userId,
          type: "deletion",
          title,
          metadata: { entityType: event.entityType, entityId: event.entityId, performedById: event.performedById },
        });

        if (owner.user.email) {
          await this.resend.sendEmail({
            to: owner.user.email,
            subject: `[MantraOS] ${title}`,
            html: `<p>${performer?.name ?? "A team member"} (${performer?.email ?? "unknown"}) deleted a ${
              event.entityType
            } record (id: ${event.entityId}).</p><p>This is limited to 1 deletion per day per person and is always logged.</p>`,
          });
        }
      }),
    );

    this.logger.log(`record.deleted handled: ${event.entityType}/${event.entityId} by ${event.performedById}`);
  }
}
