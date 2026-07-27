import { Injectable } from "@nestjs/common";

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  /** The ad account's own ISO 4217 currency (e.g. "INR") — same value on
   * every row for a given account, requested here rather than via a
   * separate `/act_<id>` object fetch: that call returned no error but
   * also no currency in practice (found via a real prod sync — see
   * DECISIONS.md), while this field on the already-working Insights edge
   * is documented and reliable. */
  account_currency?: string;
}

interface MetaInsightsResponse {
  data?: MetaInsightRow[];
  error?: { message?: string };
}

export interface MetaCampaignRow {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
}

interface MetaCampaignsResponse {
  data?: MetaCampaignRow[];
  paging?: { next?: string };
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

  /**
   * Every campaign the ad account has ever had — no status or date
   * filtering at all, since this backs a permanent Campaigns archive (see
   * DECISIONS.md "Per-campaign ad performance, not channel-consolidated") —
   * paginates through Meta's cursor-based `paging.next` until exhausted.
   */
  async fetchAllCampaigns(params: { accessToken: string; accountId: string }): Promise<MetaCampaignRow[]> {
    const fields = "id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time";
    const initialUrl = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/campaigns`);
    initialUrl.searchParams.set("fields", fields);
    initialUrl.searchParams.set("limit", "100");
    initialUrl.searchParams.set("access_token", params.accessToken);

    const campaigns: MetaCampaignRow[] = [];
    let nextUrl: string | undefined = initialUrl.toString();

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const body = (await response.json()) as MetaCampaignsResponse;
      if (!response.ok) {
        throw new Error(body.error?.message ?? `Meta API request failed (${response.status})`);
      }
      campaigns.push(...(body.data ?? []));
      nextUrl = body.paging?.next;
    }
    return campaigns;
  }

  /**
   * Per-campaign totals for one of Meta's own rolling date presets —
   * "maximum" for lifetime totals, "last_30d" for the Dashboard's rolling
   * window — rather than an explicit since/until range. Using Meta's own
   * preset means the 30-day figure is accurate from day one, not dependent
   * on how many days MantraOS's own daily sync has been running.
   */
  async fetchCampaignInsightsByPreset(params: {
    accessToken: string;
    accountId: string;
    datePreset: "maximum" | "last_30d";
  }): Promise<MetaInsightRow[]> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("fields", "campaign_id,campaign_name,impressions,clicks,spend,reach,account_currency");
    url.searchParams.set("date_preset", params.datePreset);
    url.searchParams.set("limit", "500");
    url.searchParams.set("access_token", params.accessToken);

    const response = await fetch(url.toString());
    const body = (await response.json()) as MetaInsightsResponse;
    if (!response.ok) {
      throw new Error(body.error?.message ?? `Meta API request failed (${response.status})`);
    }
    return body.data ?? [];
  }
}
