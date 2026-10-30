import { BadRequestException, Injectable } from "@nestjs/common";
import { IntegrationStatus, MarketingChannel } from "@mantra-os/db";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConnectIntegrationDto } from "./dto/connect-integration.dto";
import {
  AdCampaignDemographicRow,
  AdCampaignRegionRow,
  AdCampaignSnapshotRow,
  AdCampaignTargetedCityRow,
  IntegrationsRepository,
} from "./integrations.repository";
import { extractLeadCount, MetaAdsService } from "./meta-ads.service";

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

  findCampaignDemographics(externalCampaignId: string) {
    return this.integrations.findCampaignDemographics(externalCampaignId);
  }

  findCampaignRegions(externalCampaignId: string) {
    return this.integrations.findCampaignRegions(externalCampaignId);
  }

  findCampaignTargetedCities(externalCampaignId: string) {
    return this.integrations.findCampaignTargetedCities(externalCampaignId);
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
          leads: extractLeadCount(row.actions),
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

      // Same isolation reasoning as the archive refresh above, kept as its
      // own step rather than folded into refreshCampaignSnapshots — the
      // demographics/region/targeted-city breakdowns are supplementary
      // detail, not the primary numbers the Dashboard and Ad Campaigns
      // archive depend on, so a problem here must never block either.
      let breakdownWarning: string | undefined;
      try {
        await this.refreshCampaignBreakdowns(channel, integration);
      } catch (breakdownError) {
        breakdownWarning = breakdownError instanceof Error ? breakdownError.message : "Breakdown refresh failed";
      }

      const warnings = [
        archiveWarning && `campaign archive refresh failed: ${archiveWarning}`,
        breakdownWarning && `breakdown refresh failed: ${breakdownWarning}`,
      ].filter((w): w is string => Boolean(w));

      await this.integrations.updateSyncResult(channel, {
        status: IntegrationStatus.CONNECTED,
        lastError: warnings.length ? `Metrics synced, but ${warnings.join("; ")}` : null,
      });
      return { synced: rows.length, campaignArchiveWarning: archiveWarning, breakdownWarning };
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
    const [campaigns, lifetime, last30d] = await Promise.all([
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
    ]);

    // Same value on every row for a given account — read off whichever
    // insights call actually returned rows. See DECISIONS.md "Per-campaign
    // ad performance, not channel-consolidated" for why this isn't a
    // separate `/act_<id>` object fetch (that returned no error but also
    // no currency, found via a real prod sync).
    const currency = lifetime[0]?.account_currency ?? last30d[0]?.account_currency;

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
        lifetimeLeads: extractLeadCount(life?.actions),
        last30dSpend: Number(recent?.spend ?? 0),
        last30dImpressions: Number(recent?.impressions ?? 0),
        last30dClicks: Number(recent?.clicks ?? 0),
        last30dLeads: extractLeadCount(recent?.actions),
      };
    });

    await this.integrations.upsertCampaignSnapshots(channel, snapshots);
  }

  /**
   * Refreshes the per-campaign demographic (age×gender) and region
   * breakdowns, plus each campaign's targeted-cities list — see
   * DECISIONS.md "Per-campaign demographic and geographic breakdowns" for
   * why cities are a targeting-config list rather than a performance
   * breakdown (Meta's Insights API has no city-level breakdown dimension).
   */
  private async refreshCampaignBreakdowns(
    channel: MarketingChannel,
    integration: { accessToken: string; accountId: string },
  ): Promise<void> {
    const [demoLifetime, demoLast30d, regionLifetime, regionLast30d, adSets] = await Promise.all([
      this.metaAds.fetchCampaignInsightsByPreset({ ...integration, datePreset: "maximum", breakdowns: "age,gender" }),
      this.metaAds.fetchCampaignInsightsByPreset({ ...integration, datePreset: "last_30d", breakdowns: "age,gender" }),
      this.metaAds.fetchCampaignInsightsByPreset({ ...integration, datePreset: "maximum", breakdowns: "region" }),
      this.metaAds.fetchCampaignInsightsByPreset({ ...integration, datePreset: "last_30d", breakdowns: "region" }),
      this.metaAds.fetchAdSetsTargeting(integration),
    ]);

    const demoKey = (campaignId: string, age?: string, gender?: string) => `${campaignId}::${age ?? "unknown"}::${gender ?? "unknown"}`;
    const demoLast30dByKey = new Map(demoLast30d.map((row) => [demoKey(row.campaign_id, row.age, row.gender), row]));
    const demographicRows: AdCampaignDemographicRow[] = demoLifetime.map((row) => {
      const recent = demoLast30dByKey.get(demoKey(row.campaign_id, row.age, row.gender));
      return {
        externalCampaignId: row.campaign_id,
        ageRange: row.age ?? "unknown",
        gender: row.gender ?? "unknown",
        lifetimeSpend: Number(row.spend ?? 0),
        lifetimeImpressions: Number(row.impressions ?? 0),
        lifetimeClicks: Number(row.clicks ?? 0),
        lifetimeLeads: extractLeadCount(row.actions),
        last30dSpend: Number(recent?.spend ?? 0),
        last30dImpressions: Number(recent?.impressions ?? 0),
        last30dClicks: Number(recent?.clicks ?? 0),
        last30dLeads: extractLeadCount(recent?.actions),
      };
    });

    const regionKey = (campaignId: string, region?: string) => `${campaignId}::${region ?? "Unknown"}`;
    const regionLast30dByKey = new Map(regionLast30d.map((row) => [regionKey(row.campaign_id, row.region), row]));
    const regionRows: AdCampaignRegionRow[] = regionLifetime.map((row) => {
      const recent = regionLast30dByKey.get(regionKey(row.campaign_id, row.region));
      return {
        externalCampaignId: row.campaign_id,
        region: row.region ?? "Unknown",
        lifetimeSpend: Number(row.spend ?? 0),
        lifetimeImpressions: Number(row.impressions ?? 0),
        lifetimeClicks: Number(row.clicks ?? 0),
        lifetimeLeads: extractLeadCount(row.actions),
        last30dSpend: Number(recent?.spend ?? 0),
        last30dImpressions: Number(recent?.impressions ?? 0),
        last30dClicks: Number(recent?.clicks ?? 0),
        last30dLeads: extractLeadCount(recent?.actions),
      };
    });

    await Promise.all([
      this.integrations.upsertCampaignDemographics(channel, demographicRows),
      this.integrations.upsertCampaignRegions(channel, regionRows),
    ]);

    // Union each campaign's ad sets' targeted cities, deduped by Meta's own
    // city key (an ad set can repeat or vary targeting from its siblings).
    const citiesByCampaign = new Map<string, Map<string, AdCampaignTargetedCityRow>>();
    for (const adSet of adSets) {
      const cities = adSet.targeting?.geo_locations?.cities ?? [];
      if (cities.length === 0) continue;
      const existing = citiesByCampaign.get(adSet.campaign_id) ?? new Map<string, AdCampaignTargetedCityRow>();
      for (const city of cities) {
        existing.set(city.key, {
          externalCampaignId: adSet.campaign_id,
          cityKey: city.key,
          cityName: city.name,
          regionName: city.region,
          countryCode: city.country,
        });
      }
      citiesByCampaign.set(adSet.campaign_id, existing);
    }

    // Every campaign with either spend activity or ad-set targeting gets
    // its city list replaced — including campaigns with zero targeted
    // cities right now, so a city removed from targeting actually
    // disappears here too instead of lingering as stale data.
    const campaignIds = new Set([...demoLifetime.map((r) => r.campaign_id), ...regionLifetime.map((r) => r.campaign_id), ...citiesByCampaign.keys()]);
    await Promise.all(
      Array.from(campaignIds).map((campaignId) =>
        this.integrations.replaceCampaignTargetedCities(channel, campaignId, Array.from(citiesByCampaign.get(campaignId)?.values() ?? [])),
      ),
    );
  }
}
