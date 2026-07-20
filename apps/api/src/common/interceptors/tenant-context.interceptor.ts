import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { firstValueFrom, from, Observable } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContextService } from "../context/tenant-context.service";
import { SKIP_TENANT_CONTEXT } from "../decorators/skip-tenant-context.decorator";

/**
 * Runs AFTER TenantMembershipGuard (which already validated
 * req.organizationId against a real Membership row — see that guard's
 * comment for why membership validation lives in a guard, not here).
 *
 * This interceptor's only job: open one Prisma transaction for the rest of
 * the request, issue `SET LOCAL app.current_org_id`, and make that
 * transaction reachable to every repository via TenantContextService's
 * AsyncLocalStorage. See ARCHITECTURE.md "Tenant context & RLS enforcement".
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CONTEXT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const organizationId = req.organizationId!;
    const userId = req.user!.id;

    const result = await this.prisma.$transaction(
      async (tx) => {
        // organizationId was validated as a UUID and read back from the
        // database by TenantMembershipGuard before this ever runs — not raw
        // user input. SET LOCAL does not accept bind parameters.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);

        return this.tenantContext.run({ tx, organizationId, userId }, () => firstValueFrom(next.handle()));
      },
      // Prisma's default interactive-transaction timeout (5000ms) is too
      // tight for multi-step business operations (Shipment/GoodsReceipt
      // creation each do several sequential remote round-trips: create the
      // record, one write per inventory line, then a status recalculation
      // query) once real network latency to Neon is in play — simple CRUD
      // stays well under this, only these multi-write flows need the room.
      // Found via packages/db/scripts/verify-frontend-e2e.js — see DECISIONS.md.
      { timeout: 15000 },
    );

    return from([result]);
  }
}
