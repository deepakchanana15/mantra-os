import { Injectable } from "@nestjs/common";

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
}

interface MetaInsightsResponse {
  data?: MetaInsightRow[];
  error?: { message?: string };
}

/**
 * Thin wrapper around Meta's Marketing API (Graph API), same "plain fetch,
 * not the vendor SDK" shape as BrevoService — see DECISIONS.md "Ad platform
 * integrations, Phase 1: Meta". Each organization brings its own access
 * token + ad account ID (stored in MarketingIntegration), unlike Brevo
 * which is one shared MantraOS-wide account — so those are passed per call
 * rather than read from env config.
 */
@Injectable()
export class MetaAdsService {
  private readonly apiVersion = "v19.0";

  async fetchCampaignInsights(params: {
    accessToken: string;
    accountId: string;
    since: string;
    until: string;
  }): Promise<MetaInsightRow[]> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("fields", "campaign_id,campaign_name,impressions,clicks,spend");
    url.searchParams.set("time_range", JSON.stringify({ since: params.since, until: params.until }));
    url.searchParams.set("access_token", params.accessToken);

    const response = await fetch(url.toString());
    const body = (await response.json()) as MetaInsightsResponse;
    if (!response.ok) {
      throw new Error(body.error?.message ?? `Meta API request failed (${response.status})`);
    }
    return body.data ?? [];
  }
}
