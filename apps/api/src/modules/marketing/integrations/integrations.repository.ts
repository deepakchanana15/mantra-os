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
          update: { campaignName: row.campaignName, impressions: row.impressions, clicks: row.clicks, spend: row.spend },
        }),
      ),
    );
  }
}
