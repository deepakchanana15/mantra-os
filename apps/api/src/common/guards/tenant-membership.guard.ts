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

    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId: req.user.id } },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    if (!membership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    req.organizationId = organizationId;
    req.membership = membership;
    return true;
  }
}
