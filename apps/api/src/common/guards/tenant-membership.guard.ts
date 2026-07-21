import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { SKIP_TENANT_CONTEXT } from "../decorators/skip-tenant-context.decorator";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates X-Organization-Id against the caller's actual Membership rows
 * and attaches req.organizationId + req.membership (with role and
 * permissions preloaded).
 *
 * Runs as a GUARD, not an interceptor, specifically so PermissionGuard
 * (which needs req.membership) can run after it in the same guard phase —
 * Nest executes all guards before any interceptor, so resolving membership
 * in an interceptor would make it unavailable to permission checks.
 * TenantTransactionInterceptor (runs after guards) does the actual RLS
 * transaction, reusing req.organizationId this guard already validated.
 */
@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CONTEXT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new ForbiddenException("Tenant context requires an authenticated user");
    }

    const organizationId = req.headers["x-organization-id"];
    if (typeof organizationId !== "string" || !UUID_RE.test(organizationId)) {
      throw new BadRequestException("Missing or invalid X-Organization-Id header");
    }

    // No app.current_org_id exists yet at this point in the pipeline (that's
    // set later, by TenantContextInterceptor, using the organizationId this
    // guard is about to validate) — so this lookup relies on the memberships
    // table's second RLS policy (user_self_visibility, see rls-policies.sql
    // design note 7) instead, scoped by user rather than org.
    const userId = req.user.id;
    const membership = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
      return tx.membership.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
      });
    });
    if (!membership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    req.organizationId = organizationId;
    req.membership = membership;
    return true;
  }
}
