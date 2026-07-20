import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";

/**
 * See DECISIONS.md "Deletion governance: Owner-delegated grants, not
 * role-based delete". Presence of a non-revoked row here is what
 * DeletionGuardService checks before allowing any business-record delete.
 */
@Injectable()
export class DeletionGrantsRepository extends BaseRepository {
  findAll() {
    return this.db.userDeletionGrant.findMany({
      where: { organizationId: this.organizationId, revokedAt: null },
      include: { user: true, grantedBy: true },
      orderBy: { grantedAt: "desc" },
    });
  }

  grant(userId: string) {
    return this.db.userDeletionGrant.upsert({
      where: { organizationId_userId: { organizationId: this.organizationId, userId } },
      create: {
        organizationId: this.organizationId,
        userId,
        grantedById: this.userId,
      },
      update: {
        revokedAt: null,
        grantedById: this.userId,
        grantedAt: new Date(),
      },
      include: { user: true },
    });
  }

  async revoke(userId: string) {
    const grant = await this.db.userDeletionGrant.findUnique({
      where: { organizationId_userId: { organizationId: this.organizationId, userId } },
    });
    if (!grant || grant.revokedAt) {
      throw new NotFoundException("No active deletion grant for this user");
    }
    return this.db.userDeletionGrant.update({
      where: { id: grant.id },
      data: { revokedAt: new Date() },
    });
  }
}
