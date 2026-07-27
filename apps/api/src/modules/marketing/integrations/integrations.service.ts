import { BadRequestException, Injectable } from "@nestjs/common";
import { IntegrationStatus, MarketingChannel } from "@mantra-os/db";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConnectIntegrationDto } from "./dto/connect-integration.dto";
import { AdCampaignSnapshotRow, IntegrationsRepository } from "./integrations.repository";
import { MetaAdsService } from "./meta-ads.service";

/** Meta's account-level budget fields are in the currency's minor unit
 * (cents for USD/AUD/etc.), unlike `spend` in insights which is already a
 * major-unit decimal string — see DECISIONS.md "Per-campaign ad
 * performance, not channel-consolidated" for the caveat this carries. */
function centsToMajorUnit(value: string | undefined): number | undefined {
  return value ? Number(value) / 100 : undefined;
}

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

  findAllCampaigns() {
    return this.integrations.findAllCampaigns();
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

      // Deliberately isolated from the try/catch above it: the campaign
      // archive is a separate concern from the daily metrics sync that
      // already works in prod, so a problem here (e.g. an unexpected Meta
      // response shape) must not mark the whole sync as failed or block
      // the metrics that already succeeded — it only prevents this one
      // refresh's own updates, surfaced as a warning rather than an error.
      let archiveWarning: string | undefined;
      try {
        await this.refreshCampaignSnapshots(channel, integration);
      } catch (archiveError) {
        archiveWarning = archiveError instanceof Error ? archiveError.message : "Campaign archive refresh failed";
      }

      await this.integrations.updateSyncResult(channel, {
        status: IntegrationStatus.CONNECTED,
        lastError: archiveWarning ? `Metrics synced, but campaign archive refresh failed: ${archiveWarning}` : null,
      });
      return { synced: rows.length, campaignArchiveWarning: archiveWarning };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      await this.recordSyncFailureIndependently(channel, message);
      throw new BadRequestException(message);
    }
  }

  /**
   * Refreshes the permanent per-campaign archive (`AdCampaign`) — every
   * campaign the ad account has ever had, with lifetime and rolling
   * last-30-day totals sourced directly from Meta's own date presets. See
   * DECISIONS.md "Per-campaign ad performance, not channel-consolidated".
   */
  private async refreshCampaignSnapshots(
    channel: MarketingChannel,
    integration: { accessToken: string; accountId: string },
  ): Promise<void> {
    const [campaigns, lifetime, last30d, currency] = await Promise.all([
      this.metaAds.fetchAllCampaigns({ accessToken: integration.accessToken, accountId: integration.accountId }),
      this.metaAds.fetchCampaignInsightsByPreset({
        accessToken: integration.accessToken,
        accountId: integration.accountId,
        datePreset: "maximum",
      }),
      this.metaAds.fetchCampaignInsightsByPreset({
        accessToken: integration.accessToken,
        accountId: integration.accountId,
        datePreset: "last_30d",
      }),
      this.metaAds.fetchAdAccountCurrency({ accessToken: integration.accessToken, accountId: integration.accountId }),
    ]);

    const lifetimeById = new Map(lifetime.map((row) => [row.campaign_id, row]));
    const last30dById = new Map(last30d.map((row) => [row.campaign_id, row]));

    const snapshots: AdCampaignSnapshotRow[] = campaigns.map((campaign) => {
      const life = lifetimeById.get(campaign.id);
      const recent = last30dById.get(campaign.id);
      return {
        externalCampaignId: campaign.id,
        name: campaign.name,
        status: campaign.effective_status ?? campaign.status,
        objective: campaign.objective,
        currency,
        dailyBudget: centsToMajorUnit(campaign.daily_budget),
        lifetimeBudget: centsToMajorUnit(campaign.lifetime_budget),
        startDate: campaign.start_time ? new Date(campaign.start_time) : campaign.created_time ? new Date(campaign.created_time) : undefined,
        stopDate: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
        lifetimeSpend: Number(life?.spend ?? 0),
        lifetimeImpressions: Number(life?.impressions ?? 0),
        lifetimeClicks: Number(life?.clicks ?? 0),
        lifetimeReach: life?.reach ? Number(life.reach) : undefined,
        last30dSpend: Number(recent?.spend ?? 0),
        last30dImpressions: Number(recent?.impressions ?? 0),
        last30dClicks: Number(recent?.clicks ?? 0),
      };
    });

    await this.integrations.upsertCampaignSnapshots(channel, snapshots);
  }
}
