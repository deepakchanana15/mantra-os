import { Injectable } from "@nestjs/common";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class OrganizationsRepository extends BaseRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  /**
   * Not tenant-scoped by design — lists orgs the user belongs to, for the org
   * switcher (SkipTenantContext route, runs before any org is selected). This
   * still needs its own small transaction: `memberships` has FORCE RLS, and
   * with no app.current_org_id set (there's no org yet — that's the whole
   * point of this query), the org-context policy alone would return zero
   * rows for every user, always. Relies on the memberships table's second
   * RLS policy (user_self_visibility, see rls-policies.sql design note 7),
   * scoped by user rather than org.
   */
  findAllForUser(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
      return tx.organization.findMany({
        where: { memberships: { some: { userId } }, deletedAt: null },
        orderBy: { name: "asc" },
      });
    });
  }

  findCurrent() {
    return this.db.organization.findUniqueOrThrow({
      where: { id: this.organizationId },
      include: { settings: true },
    });
  }

  updateCurrent(data: { name?: string; slug?: string }) {
    return this.db.organization.update({
      where: { id: this.organizationId },
      data,
    });
  }
}
