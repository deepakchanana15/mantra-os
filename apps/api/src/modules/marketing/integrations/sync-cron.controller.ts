import { Controller, Get, Headers, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IntegrationStatus, MarketingChannel } from "@mantra-os/db";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { IntegrationsRepository } from "./integrations.repository";
import { IntegrationsService } from "./integrations.service";

/**
 * Daily Vercel Cron target (see apps/api/vercel.json) — pulls yesterday's
 * ad-campaign performance for every connected integration, across every
 * organization. There's no single tenant to scope this request to (it's
 * not triggered by a logged-in user), so it's excluded from the global
 * per-request RLS transaction (@SkipTenantContext) and instead manually
 * opens one RLS-scoped transaction per organization — same mechanism
 * TenantContextInterceptor uses per-request, just driven by a loop over
 * every org instead of a single X-Organization-Id header. `organizations`
 * itself carries no RLS policy (see DATABASE.md), so listing every org id
 * first is safe without any tenant context set yet.
 *
 * Verified via Vercel's own convention: setting a `CRON_SECRET` env var
 * makes Vercel Cron send `Authorization: Bearer <CRON_SECRET>` automatically.
 */
@Controller("v1/internal/sync-ad-metrics")
@SkipTenantContext()
export class SyncCronController {
  private readonly logger = new Logger(SyncCronController.name);
  private readonly cronSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly integrationsRepo: IntegrationsRepository,
    private readonly integrationsService: IntegrationsService,
  ) {
    this.cronSecret = config.getOrThrow<string>("CRON_SECRET");
  }

  @Get()
  async handle(@Headers("authorization") authHeader: string | undefined) {
    if (authHeader !== `Bearer ${this.cronSecret}`) {
      throw new UnauthorizedException();
    }

    const orgs = await this.prisma.organization.findMany({ where: { deletedAt: null }, select: { id: true } });
    let synced = 0;
    let failed = 0;

    for (const org of orgs) {
      await this.prisma.$transaction(
        async (tx) => {
          // org.id came from our own query above, not external input.
          await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${org.id}'`);
          await this.tenantContext.run({ tx, organizationId: org.id, userId: "system-cron" }, async () => {
            const integrations = await this.integrationsRepo.findAll();
            for (const integration of integrations) {
              if (integration.channel !== MarketingChannel.META || integration.status === IntegrationStatus.DISCONNECTED) {
                continue;
              }
              try {
                await this.integrationsService.sync(integration.channel);
                synced++;
              } catch (error) {
                failed++;
                this.logger.error(`Sync failed for org ${org.id} channel ${integration.channel}: ${error}`);
              }
            }
          });
        },
        // Each org's sync makes a real network call to Meta's API per
        // connected channel — Prisma's default 5s interactive-transaction
        // timeout is too tight once that's in the mix (same reasoning as
        // TenantContextInterceptor's own 15s override).
        { timeout: 15000 },
      );
    }

    return { orgsChecked: orgs.length, synced, failed };
  }
}
