import { ForbiddenException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TenantContextService } from "../context/tenant-context.service";
import { RECORD_DELETED_EVENT } from "../events/record-deleted.event";

const DAILY_DELETE_LIMIT = 1;

/**
 * Shared deletion governance — see DECISIONS.md "Deletion governance:
 * Owner-delegated grants, not role-based delete" and
 * ARCHITECTURE.md "Deletion governance".
 *
 * Every domain service that supports deletion calls `authorize()` BEFORE
 * soft-deleting a row, then `recordAndNotify()` after. The actual
 * `update({ deletedAt: new Date() })` stays in the domain repository
 * (this service doesn't know Product from SalesOrder) — this class only
 * owns the cross-cutting rule, not the per-table mutation.
 */
@Injectable()
export class DeletionGuardService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async authorize(params: { entityCreatedBy: string }): Promise<void> {
    const { tx: db, userId, organizationId } = this.tenantContext.store;

    const isOwner = await this.isOwner(userId, organizationId);

    if (!isOwner) {
      const grant = await db.userDeletionGrant.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
      });
      if (!grant || grant.revokedAt) {
        throw new ForbiddenException(
          "You don't have permission to delete records. Ask the Owner to grant you delete access.",
        );
      }
    }

    if (params.entityCreatedBy === userId && !isOwner) {
      throw new ForbiddenException(
        "You can't delete a record you created yourself. Ask someone above you to delete it.",
      );
    }

    const deletionsToday = await db.auditLog.count({
      where: {
        organizationId,
        performedById: userId,
        action: "delete",
        createdAt: { gte: this.startOfToday() },
      },
    });
    if (deletionsToday >= DAILY_DELETE_LIMIT) {
      throw new ForbiddenException(
        `You've reached your deletion limit for today (${DAILY_DELETE_LIMIT} per day). Try again tomorrow.`,
      );
    }
  }

  async recordAndNotify(params: { entityType: string; entityId: string; targetUserId: string }): Promise<void> {
    const { tx: db, userId, organizationId } = this.tenantContext.store;

    await db.auditLog.create({
      data: {
        organizationId,
        action: "delete",
        entityType: params.entityType,
        entityId: params.entityId,
        performedById: userId,
        targetUserId: params.targetUserId,
      },
    });

    // emitAsync, not emit — this listener is async (writes a Notification +
    // calls Brevo), and it runs inside the same request transaction via
    // TenantContextService's AsyncLocalStorage. Plain emit() doesn't await
    // async listeners, so the transaction was committing (and closing)
    // before the listener finished, throwing "Transaction already closed."
    // Found via packages/db/scripts/verify-frontend-e2e.js — see DECISIONS.md.
    await this.eventEmitter.emitAsync(RECORD_DELETED_EVENT, {
      organizationId,
      entityType: params.entityType,
      entityId: params.entityId,
      performedById: userId,
    });
  }

  /**
   * Convenience wrapper for the common case: authorize, run the caller's
   * soft-delete, then audit + notify. Every domain service that supports
   * deletion should go through this rather than calling authorize()/
   * recordAndNotify() separately, to avoid re-deriving the same three-step
   * sequence in nine different places.
   */
  async deleteWithGovernance<T>(params: {
    entityType: string;
    entityId: string;
    entityCreatedBy: string;
    softDelete: () => Promise<T>;
  }): Promise<T> {
    await this.authorize({ entityCreatedBy: params.entityCreatedBy });
    const result = await params.softDelete();
    await this.recordAndNotify({
      entityType: params.entityType,
      entityId: params.entityId,
      targetUserId: params.entityCreatedBy,
    });
    return result;
  }

  private async isOwner(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.tenantContext.db.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    });
    return membership?.role.key === "owner";
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
