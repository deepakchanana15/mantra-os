import { Injectable, NotFoundException } from "@nestjs/common";
import { IntegrationStatus, MarketingChannel } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { ConnectIntegrationDto } from "./dto/connect-integration.dto";

export interface AdMetricRow {
  externalCampaignId: string;
  campaignName: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
}

export interface AdCampaignSnapshotRow {
  externalCampaignId: string;
  name: string;
  status?: string;
  objective?: string;
  currency?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startDate?: Date;
  stopDate?: Date;
  lifetimeSpend: number;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  lifetimeReach?: number;
  lifetimeLeads: number;
  last30dSpend: number;
  last30dImpressions: number;
  last30dClicks: number;
  last30dLeads: number;
}

export interface AdCampaignDemographicRow {
  externalCampaignId: string;
  ageRange: string;
  gender: string;
  lifetimeSpend: number;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  lifetimeLeads: number;
  last30dSpend: number;
  last30dImpressions: number;
  last30dClicks: number;
  last30dLeads: number;
}

export interface AdCampaignRegionRow {
  externalCampaignId: string;
  region: string;
  lifetimeSpend: number;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  lifetimeLeads: number;
  last30dSpend: number;
  last30dImpressions: number;
  last30dClicks: number;
  last30dLeads: number;
}

export interface AdCampaignTargetedCityRow {
  externalCampaignId: string;
  cityKey: string;
  cityName: string;
  regionName?: string;
  countryCode?: string;
}

const INTEGRATION_SELECT = {
  id: true,
  channel: true,
  accountId: true,
  status: true,
  lastSyncedAt: true,
  lastError: true,
  createdAt: true,
} as const;

/**
 * `accessToken` is deliberately never included in any select here — the
 * frontend only ever sees connection status, not the credential itself,
 * once it's stored. See DECISIONS.md "Ad platform integrations, Phase 1: Meta".
 */
@Injectable()
export class IntegrationsRepository extends BaseRepository {
  findAll() {
    return this.db.marketingIntegration.findMany({
      where: { organizationId: this.organizationId },
      select: INTEGRATION_SELECT,
      orderBy: { channel: "asc" },
    });
  }

  async findByChannelOrThrow(channel: MarketingChannel) {
    const integration = await this.db.marketingIntegration.findFirst({
      where: { organizationId: this.organizationId, channel },
    });
    if (!integration) {
      throw new NotFoundException(`${channel} is not connected`);
    }
    return integration;
  }

  connect(dto: ConnectIntegrationDto) {
    return this.db.marketingIntegration.upsert({
      where: { organizationId_channel: { organizationId: this.organizationId, channel: dto.channel } },
      create: {
        organizationId: this.organizationId,
        channel: dto.channel,
        accessToken: dto.accessToken,
        accountId: dto.accountId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
      update: {
        accessToken: dto.accessToken,
        accountId: dto.accountId,
        status: IntegrationStatus.CONNECTED,
        lastError: null,
        updatedBy: this.userId,
      },
      select: INTEGRATION_SELECT,
    });
  }

  async disconnect(channel: MarketingChannel) {
    await this.findByChannelOrThrow(channel);
    await this.db.marketingIntegration.delete({
      where: { organizationId_channel: { organizationId: this.organizationId, channel } },
    });
  }

  updateSyncResult(channel: MarketingChannel, params: { status: IntegrationStatus; lastError?: string | null }) {
    return this.db.marketingIntegration.update({
      where: { organizationId_channel: { organizationId: this.organizationId, channel } },
      data: {
        status: params.status,
        lastSyncedAt: new Date(),
        lastError: params.lastError ?? null,
        updatedBy: this.userId,
      },
    });
  }

  upsertMetrics(channel: MarketingChannel, rows: AdMetricRow[]) {
    return Promise.all(
      rows.map((row) =>
        this.db.adCampaignMetric.upsert({
          where: {
            organizationId_channel_externalCampaignId_date: {
              organizationId: this.organizationId,
              channel,
              externalCampaignId: row.externalCampaignId,
              date: row.date,
            },
          },
          create: { organizationId: this.organizationId, channel, ...row },
          update: { campaignName: row.campaignName, impressions: row.impressions, clicks: row.clicks, spend: row.spend, leads: row.leads },
        }),
      ),
    );
  }

  /**
   * Never removes a row, even for a campaign the platform now reports as
   * archived/deleted — see the `AdCampaign` model comment: this is meant to
   * be a permanent archive of every campaign ever seen.
   */
  upsertCampaignSnapshots(channel: MarketingChannel, rows: AdCampaignSnapshotRow[]) {
    return Promise.all(
      rows.map((row) =>
        this.db.adCampaign.upsert({
          where: {
            organizationId_channel_externalCampaignId: {
              organizationId: this.organizationId,
              channel,
              externalCampaignId: row.externalCampaignId,
            },
          },
          create: { organizationId: this.organizationId, channel, ...row, lastSyncedAt: new Date() },
          update: { ...row, lastSyncedAt: new Date() },
        }),
      ),
    );
  }

  findAllCampaigns() {
    return this.db.adCampaign.findMany({
      where: { organizationId: this.organizationId },
      orderBy: { lifetimeSpend: "desc" },
    });
  }

  /**
   * `Promise.allSettled`, not `Promise.all` — unlike the single-row-per-
   * campaign upserts above, a breakdown sync can be dozens of rows (every
   * age×gender or region combination across every campaign), and one bad
   * row failing the *entire* batch (as `Promise.all` would) would silently
   * wipe out breakdown data for campaigns whose rows were otherwise fine.
   * Failures are swallowed here — this is supplementary detail, not the
   * primary spend/impressions figures `AdCampaign` itself already has.
   */
  async upsertCampaignDemographics(channel: MarketingChannel, rows: AdCampaignDemographicRow[]): Promise<void> {
    await Promise.allSettled(
      rows.map((row) =>
        this.db.adCampaignDemographic.upsert({
          where: {
            organizationId_channel_externalCampaignId_ageRange_gender: {
              organizationId: this.organizationId,
              channel,
              externalCampaignId: row.externalCampaignId,
              ageRange: row.ageRange,
              gender: row.gender,
            },
          },
          create: { organizationId: this.organizationId, channel, ...row, lastSyncedAt: new Date() },
          update: { ...row, lastSyncedAt: new Date() },
        }),
      ),
    );
  }

  findCampaignDemographics(externalCampaignId: string) {
    return this.db.adCampaignDemographic.findMany({
      where: { organizationId: this.organizationId, externalCampaignId },
      orderBy: [{ ageRange: "asc" }, { gender: "asc" }],
    });
  }

  async upsertCampaignRegions(channel: MarketingChannel, rows: AdCampaignRegionRow[]): Promise<void> {
    await Promise.allSettled(
      rows.map((row) =>
        this.db.adCampaignRegion.upsert({
          where: {
            organizationId_channel_externalCampaignId_region: {
              organizationId: this.organizationId,
              channel,
              externalCampaignId: row.externalCampaignId,
              region: row.region,
            },
          },
          create: { organizationId: this.organizationId, channel, ...row, lastSyncedAt: new Date() },
          update: { ...row, lastSyncedAt: new Date() },
        }),
      ),
    );
  }

  findCampaignRegions(externalCampaignId: string) {
    return this.db.adCampaignRegion.findMany({
      where: { organizationId: this.organizationId, externalCampaignId },
      orderBy: { lifetimeSpend: "desc" },
    });
  }

  /**
   * Replace-on-sync, not upsert-and-keep: unlike spend/impressions
   * (historical facts that never need removing), a targeted-city list is
   * current *configuration* — if a city is no longer targeted, it should
   * disappear here too, not linger as stale data implying it still is.
   */
  async replaceCampaignTargetedCities(channel: MarketingChannel, externalCampaignId: string, rows: AdCampaignTargetedCityRow[]): Promise<void> {
    await this.db.adCampaignTargetedCity.deleteMany({
      where: { organizationId: this.organizationId, channel, externalCampaignId },
    });
    if (rows.length === 0) return;
    await this.db.adCampaignTargetedCity.createMany({
      data: rows.map((row) => ({ organizationId: this.organizationId, channel, ...row, lastSyncedAt: new Date() })),
    });
  }

  findCampaignTargetedCities(externalCampaignId: string) {
    return this.db.adCampaignTargetedCity.findMany({
      where: { organizationId: this.organizationId, externalCampaignId },
      orderBy: { cityName: "asc" },
    });
  }
}
