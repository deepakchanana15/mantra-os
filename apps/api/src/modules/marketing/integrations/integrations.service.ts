import { BadRequestException, Injectable } from "@nestjs/common";
import { IntegrationStatus, MarketingChannel } from "@mantra-os/db";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConnectIntegrationDto } from "./dto/connect-integration.dto";
import { IntegrationsRepository } from "./integrations.repository";
import { MetaAdsService } from "./meta-ads.service";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly integrations: IntegrationsRepository,
    private readonly metaAds: MetaAdsService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * When sync() fails, it both records the failure (status/lastError) AND
   * throws — but a throw inside the request-scoped transaction
   * (TenantContextInterceptor's) rolls back everything written during that
   * same transaction, including the failure record itself. This writes
   * the failure through its own independent transaction instead, so it
   * survives regardless of what the caller does after this returns.
   */
  private async recordSyncFailureIndependently(channel: MarketingChannel, message: string): Promise<void> {
    const organizationId = this.tenantContext.organizationId;
    await this.prisma.$transaction(async (tx) => {
      // organizationId came from the already-validated request context, not raw input.
      await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
      await tx.marketingIntegration.update({
        where: { organizationId_channel: { organizationId, channel } },
        data: { status: IntegrationStatus.ERROR, lastError: message, lastSyncedAt: new Date() },
      });
    });
  }

  findAll() {
    return this.integrations.findAll();
  }

  connect(dto: ConnectIntegrationDto) {
    return this.integrations.connect(dto);
  }

  disconnect(channel: MarketingChannel) {
    return this.integrations.disconnect(channel);
  }

  /**
   * Pulls yesterday's campaign performance — matches the daily cron
   * cadence (see DECISIONS.md "Ad platform integrations, Phase 1: Meta").
   * Only META is wired up so far; Google/Bing are follow-on phases that
   * reuse this same shape.
   */
  async sync(channel: MarketingChannel) {
    if (channel !== MarketingChannel.META) {
      throw new BadRequestException(`${channel} isn't wired up yet — Meta is the only connected channel so far`);
    }

    const integration = await this.integrations.findByChannelOrThrow(channel);
    const until = new Date();
    const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);

    try {
      const rows = await this.metaAds.fetchCampaignInsights({
        accessToken: integration.accessToken,
        accountId: integration.accountId,
        since: isoDate(since),
        until: isoDate(since),
      });

      await this.integrations.upsertMetrics(
        channel,
        rows.map((row) => ({
          externalCampaignId: row.campaign_id,
          campaignName: row.campaign_name,
          date: new Date(isoDate(since)),
          impressions: Number(row.impressions ?? 0),
          clicks: Number(row.clicks ?? 0),
          spend: Number(row.spend ?? 0),
        })),
      );
      await this.integrations.updateSyncResult(channel, { status: IntegrationStatus.CONNECTED });
      return { synced: rows.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      await this.recordSyncFailureIndependently(channel, message);
      throw new BadRequestException(message);
    }
  }
}
