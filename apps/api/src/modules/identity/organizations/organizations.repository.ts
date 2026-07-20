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

  /** Not tenant-scoped by design — lists orgs the user belongs to, for the org switcher. Runs outside the RLS transaction (SkipTenantContext route). */
  findAllForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } }, deletedAt: null },
      orderBy: { name: "asc" },
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
