import { Injectable } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { TenantContextService } from "../context/tenant-context.service";

/**
 * Every domain repository extends this instead of injecting PrismaService
 * directly. `this.db` is the request-scoped transaction client carrying the
 * `SET LOCAL app.current_org_id` that makes RLS apply — injecting the raw
 * PrismaService here would silently skip tenant isolation.
 */
@Injectable()
export abstract class BaseRepository {
  constructor(protected readonly tenantContext: TenantContextService) {}

  protected get db(): Prisma.TransactionClient {
    return this.tenantContext.db;
  }

  protected get organizationId(): string {
    return this.tenantContext.organizationId;
  }

  protected get userId(): string {
    return this.tenantContext.userId;
  }
}
