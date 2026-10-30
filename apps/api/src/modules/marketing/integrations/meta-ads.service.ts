import { Injectable } from "@nestjs/common";

interface MetaActionRow {
  action_type: string;
  value: string;
}

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
  /** Conversion breakdown — lead-form submissions show up here, not as
   * their own top-level field. See extractLeadCount() below. */
  actions?: MetaActionRow[];
  /** Only present when the call requested `breakdowns=age,gender`. */
  age?: string;
  gender?: string;
  /** Only present when the call requested `breakdowns=region` — state/
   * province, the most granular *performance* geography Meta exposes
   * (there is no city-level breakdown). See `fetchAdSetsTargeting` for
   * the separate, non-performance "which cities are targeted" list. */
  region?: string;
}

/**
 * Meta reports Instant Form / on-Facebook lead submissions under one of a
 * few action_type values depending on the campaign's objective and API
 * version — checked in priority order and the first match used (never
 * summed across them, since more than one can describe the same
 * underlying leads and summing would double-count).
 */
const LEAD_ACTION_TYPES = ["onsite_conversion.lead_grouped", "lead", "leadgen.other"];

export function extractLeadCount(actions: MetaActionRow[] | undefined): number {
  if (!actions) return 0;
  for (const actionType of LEAD_ACTION_TYPES) {
    const match = actions.find((a) => a.action_type === actionType);
    if (match) return Number(match.value) || 0;
  }
  return 0;
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

export interface MetaGeoCity {
  key: string;
  name: string;
  region?: string;
  country?: string;
}

export interface MetaAdSetRow {
  campaign_id: string;
  targeting?: { geo_locations?: { cities?: MetaGeoCity[] } };
}

interface MetaAdSetsResponse {
  data?: MetaAdSetRow[];
  paging?: { next?: string };
  error?: { message?: string };
}

export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MetaLeadDetails {
  id: string;
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  form_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  field_data: MetaLeadField[];
}

interface MetaLeadDetailsResponse extends Partial<MetaLeadDetails> {
  error?: { message?: string };
}

const NAME_FIELD_KEYS = ["full_name", "name"];
const FIRST_NAME_KEYS = ["first_name"];
const LAST_NAME_KEYS = ["last_name"];
const EMAIL_FIELD_KEYS = ["email"];
const PHONE_FIELD_KEYS = ["phone_number", "phone"];

/**
 * Meta's lead-form "questions" are free-form per form (a mix of its own
 * standard fields and whatever custom questions the form's author added),
 * delivered as a flat `field_data` array rather than a fixed shape. Pulls
 * out the three fields MantraOS actually has columns for (name/email/
 * phone) by checking known standard field-name variants, and folds every
 * other answered question into a notes string so it isn't silently
 * dropped — same "capture everything, structure what we can" approach as
 * LeadIntakeController's `message` field.
 */
export function mapLeadFieldData(fieldData: MetaLeadField[]): { name?: string; email?: string; phone?: string; notes?: string } {
  const get = (keys: string[]) => fieldData.find((f) => keys.includes(f.name.toLowerCase()))?.values?.[0];

  const firstName = get(FIRST_NAME_KEYS);
  const lastName = get(LAST_NAME_KEYS);
  const name = get(NAME_FIELD_KEYS) ?? ([firstName, lastName].filter(Boolean).join(" ") || undefined);
  const email = get(EMAIL_FIELD_KEYS);
  const phone = get(PHONE_FIELD_KEYS);

  const knownKeys = new Set([...NAME_FIELD_KEYS, ...FIRST_NAME_KEYS, ...LAST_NAME_KEYS, ...EMAIL_FIELD_KEYS, ...PHONE_FIELD_KEYS]);
  const extraLines = fieldData.filter((f) => !knownKeys.has(f.name.toLowerCase())).map((f) => `${f.name}: ${f.values.join(", ")}`);

  return { name, email, phone, notes: extraLines.length ? extraLines.join("\n") : undefined };
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
  // Bumped from v19.0 (Oct 2026) — that version had been fully retired by
  // Meta (no longer even selectable in Graph API Explorer's version
  // dropdown), which silently dropped newer ODAX-objective campaigns from
  // /campaigns list calls rather than erroring outright. Confirmed via a
  // real prod account: the same request against v26.0 returned all 6
  // campaigns, v19.0's deployed behavior only surfaced 4. Re-verified
  // directly against the live account before changing this.
  private readonly apiVersion = "v26.0";

  async fetchCampaignInsights(params: {
    accessToken: string;
    accountId: string;
    since: string;
    until: string;
  }): Promise<MetaInsightRow[]> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("fields", "campaign_id,campaign_name,impressions,clicks,spend,actions");
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
   *
   * `breakdowns` optionally splits each campaign's totals further (e.g.
   * "age,gender" or "region") — Meta then returns one row per
   * (campaign, breakdown-value) combination instead of one row per
   * campaign, which is how AdCampaignDemographic/AdCampaignRegion get
   * their data. Omit it for the plain per-campaign totals AdCampaign uses.
   */
  async fetchCampaignInsightsByPreset(params: {
    accessToken: string;
    accountId: string;
    datePreset: "maximum" | "last_30d";
    breakdowns?: string;
  }): Promise<MetaInsightRow[]> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("fields", "campaign_id,campaign_name,impressions,clicks,spend,reach,account_currency,actions");
    if (params.breakdowns) url.searchParams.set("breakdowns", params.breakdowns);
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

  /**
   * Which cities each ad set is targeting — the `geo_locations.cities`
   * array lives on the ad set, not the campaign, so this is a separate
   * call from `fetchAllCampaigns`. Paginates through every ad set on the
   * account (same cursor pattern as `fetchAllCampaigns`); callers group
   * the results by `campaign_id` themselves, since one campaign commonly
   * has several ad sets, each with its own (possibly different) targeting.
   */
  async fetchAdSetsTargeting(params: { accessToken: string; accountId: string }): Promise<MetaAdSetRow[]> {
    const initialUrl = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${params.accountId}/adsets`);
    initialUrl.searchParams.set("fields", "campaign_id,targeting{geo_locations}");
    initialUrl.searchParams.set("limit", "100");
    initialUrl.searchParams.set("access_token", params.accessToken);

    const adSets: MetaAdSetRow[] = [];
    let nextUrl: string | undefined = initialUrl.toString();

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const body = (await response.json()) as MetaAdSetsResponse;
      if (!response.ok) {
        throw new Error(body.error?.message ?? `Meta API request failed (${response.status})`);
      }
      adSets.push(...(body.data ?? []));
      nextUrl = body.paging?.next;
    }
    return adSets;
  }

  /**
   * The leadgen webhook only carries a `leadgen_id` — the lead's actual
   * answers (name/email/phone/custom questions) require this separate
   * call, authorized with the Page Access Token (not the ad-account token
   * used for Insights) since `leads_retrieval` is a Page-level permission.
   */
  async fetchLeadDetails(params: { leadgenId: string; accessToken: string }): Promise<MetaLeadDetails> {
    // Deliberately NOT requesting ad_name/form_name/campaign_name here —
    // those require Meta to resolve a related ad/campaign object, which
    // fails (and appears to take the WHOLE request down with it, not just
    // that one field) for a lead with no real ad behind it — confirmed via
    // Meta's own Lead Ads Testing Tool, whose synthetic leads always have
    // ad_id: null. field_data (the actual answers) is all this feature
    // needs; the *_id fields are kept for reference even though they
    // resolve to nothing meaningful on a null-ad lead.
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${params.leadgenId}`);
    url.searchParams.set("fields", "field_data,ad_id,form_id,campaign_id,created_time");
    url.searchParams.set("access_token", params.accessToken);

    const response = await fetch(url.toString());
    const body = (await response.json()) as MetaLeadDetailsResponse;
    if (!response.ok) {
      throw new Error(body.error?.message ?? `Meta API request failed (${response.status})`);
    }
    return { field_data: [], ...body, id: body.id ?? params.leadgenId };
  }
}
