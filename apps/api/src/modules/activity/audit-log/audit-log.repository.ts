import { Injectable } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";

export const AUDIT_ACTION_VIEWED = "VIEWED";

@Injectable()
export class AuditLogRepository extends BaseRepository {
  record(params: { entityType: string; entityId: string; action: string; metadata?: Record<string, unknown> }) {
    return this.db.auditLog.create({
      data: {
        organizationId: this.organizationId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedById: this.userId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Per-viewer summary, not a raw per-view log — a record opened 40 times
   * by the same person should show one line, not 40 (see the Opportunity/
   * Customer activity-timeline design: access history stays a compact
   * side panel, separate from the main note/action feed).
   */
  async findViewSummary(entityType: string, entityId: string) {
    const views = await this.db.auditLog.findMany({
      where: { organizationId: this.organizationId, entityType, entityId, action: AUDIT_ACTION_VIEWED },
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { id: true, name: true } } },
    });

    const byUser = new Map<string, { userId: string; userName: string; lastViewedAt: Date; viewCount: number }>();
    for (const view of views) {
      const existing = byUser.get(view.performedById);
      if (existing) {
        existing.viewCount += 1;
      } else {
        byUser.set(view.performedById, {
          userId: view.performedById,
          userName: view.performedBy.name,
          lastViewedAt: view.createdAt,
          viewCount: 1,
        });
      }
    }
    return [...byUser.values()].sort((a, b) => b.lastViewedAt.getTime() - a.lastViewedAt.getTime());
  }

  /**
   * Every individual view, timestamped — the raw log behind `findViewSummary`'s
   * collapsed "Viewed by X (3x)" line, for when someone actually needs to see
   * each access rather than just the last one.
   */
  findFullViewLog(entityType: string, entityId: string) {
    return this.db.auditLog.findMany({
      where: { organizationId: this.organizationId, entityType, entityId, action: AUDIT_ACTION_VIEWED },
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { id: true, name: true } } },
    });
  }

  /** Every logged action on this entity except raw views — those are summarized separately above. */
  findActionsForEntity(entityType: string, entityId: string) {
    return this.db.auditLog.findMany({
      where: { organizationId: this.organizationId, entityType, entityId, action: { not: AUDIT_ACTION_VIEWED } },
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { id: true, name: true } } },
    });
  }
}
