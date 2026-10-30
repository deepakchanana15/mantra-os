"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface AdCampaign {
  id: string;
  externalCampaignId: string;
  channel: string;
  name: string;
  status: string | null;
  objective: string | null;
  currency: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  startDate: string | null;
  stopDate: string | null;
  lifetimeSpend: string;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  lifetimeReach: number | null;
  lifetimeLeads: number;
  last30dSpend: string;
  last30dImpressions: number;
  last30dClicks: number;
  last30dLeads: number;
  lastSyncedAt: string | null;
}

interface DemographicRow {
  ageRange: string;
  gender: string;
  lifetimeSpend: string;
  lifetimeImpressions: number;
  lifetimeLeads: number;
  last30dSpend: string;
  last30dLeads: number;
}

interface RegionRow {
  region: string;
  lifetimeSpend: string;
  lifetimeImpressions: number;
  lifetimeLeads: number;
  last30dSpend: string;
  last30dLeads: number;
}

interface TargetedCityRow {
  cityName: string;
  regionName: string | null;
  countryCode: string | null;
}

interface CampaignBreakdown {
  demographics: DemographicRow[];
  regions: RegionRow[];
  cities: TargetedCityRow[];
}

function ctr(clicks: number, impressions: number): string {
  return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—";
}

/**
 * Never assume USD — the platform's own spend figures are already in the
 * ad account's real currency (e.g. INR). A campaign whose currency hasn't
 * synced yet shows a plain number rather than a wrong currency symbol. See
 * DECISIONS.md "Per-campaign ad performance, not channel-consolidated".
 */
function formatMoney(amount: number, currency: string | null): string {
  if (!currency) {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

const AD_CHANNEL_LABELS: Record<string, string> = {
  META: "Meta",
  GOOGLE: "Google Ads",
  BING: "Bing/Microsoft Ads",
};

const AD_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ARCHIVED: "neutral",
  DELETED: "destructive",
  WITH_ISSUES: "destructive",
  PENDING_REVIEW: "warning",
  DISAPPROVED: "destructive",
};

const GENDER_LABELS: Record<string, string> = { male: "Male", female: "Female", unknown: "Unknown" };

/**
 * Expandable rows — age/gender and region breakdowns, plus each campaign's
 * targeted-cities list, fetched lazily on first expand (not upfront for
 * every campaign) and cached per campaign for the rest of the page's life.
 * See DECISIONS.md "Per-campaign demographic and geographic breakdowns" for
 * why targeted cities is a config list, not a performance breakdown — Meta
 * has no city-level breakdown dimension, region (state/province) is the
 * finest geographic *performance* split it offers.
 */
export function AdCampaignsTable({ campaigns }: { campaigns: AdCampaign[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [breakdowns, setBreakdowns] = useState<Record<string, CampaignBreakdown | "loading" | "error">>({});

  async function toggle(campaign: AdCampaign) {
    if (expandedId === campaign.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(campaign.id);
    if (breakdowns[campaign.id]) return;

    setBreakdowns((prev) => ({ ...prev, [campaign.id]: "loading" }));
    try {
      const [demoRes, regionRes, cityRes] = await Promise.all([
        fetch(`/api/v1/marketing-integrations/campaigns/${campaign.externalCampaignId}/demographics`),
        fetch(`/api/v1/marketing-integrations/campaigns/${campaign.externalCampaignId}/regions`),
        fetch(`/api/v1/marketing-integrations/campaigns/${campaign.externalCampaignId}/targeted-cities`),
      ]);
      if (!demoRes.ok || !regionRes.ok || !cityRes.ok) throw new Error("Failed to load breakdown");
      const [demographics, regions, cities] = await Promise.all([demoRes.json(), regionRes.json(), cityRes.json()]);
      setBreakdowns((prev) => ({ ...prev, [campaign.id]: { demographics, regions, cities } }));
    } catch {
      setBreakdowns((prev) => ({ ...prev, [campaign.id]: "error" }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Campaign</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Objective</TableHead>
            <TableHead>Live since</TableHead>
            <TableHead className="text-right">Lifetime spend</TableHead>
            <TableHead className="text-right">Lifetime impressions</TableHead>
            <TableHead className="text-right">Lifetime clicks</TableHead>
            <TableHead className="text-right">Lifetime CTR</TableHead>
            <TableHead className="text-right">Lifetime reach</TableHead>
            <TableHead className="text-right">Lifetime leads</TableHead>
            <TableHead className="text-right">Last 30 days spend</TableHead>
            <TableHead className="text-right">Last 30 days leads</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="py-10 text-center text-sm text-faint">
                No ad-platform campaigns synced yet.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => {
              const isExpanded = expandedId === campaign.id;
              const breakdown = breakdowns[campaign.id];
              return (
                <Fragment key={campaign.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggle(campaign)}>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-faint" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-faint" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {AD_CHANNEL_LABELS[campaign.channel] ?? campaign.channel}
                    </TableCell>
                    <TableCell>
                      {campaign.status ? (
                        <Badge variant={AD_STATUS_VARIANT[campaign.status] ?? "neutral"}>{campaign.status}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{campaign.objective ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(campaign.lifetimeSpend), campaign.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.lifetimeImpressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.lifetimeClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {ctr(campaign.lifetimeClicks, campaign.lifetimeImpressions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {campaign.lifetimeReach !== null ? campaign.lifetimeReach.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.lifetimeLeads.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(campaign.last30dSpend), campaign.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.last30dLeads.toLocaleString()}</TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={14} className="bg-surface-secondary p-4">
                        {breakdown === "loading" && <p className="text-sm text-faint">Loading breakdown…</p>}
                        {breakdown === "error" && (
                          <p className="text-sm text-destructive">Couldn&apos;t load the breakdown for this campaign.</p>
                        )}
                        {breakdown && breakdown !== "loading" && breakdown !== "error" && (
                          <div className="flex flex-col gap-5">
                            <div>
                              <p className="mb-2 text-xs font-medium text-muted-foreground">Age &amp; gender</p>
                              {breakdown.demographics.length === 0 ? (
                                <p className="text-sm text-faint">No demographic data yet.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Age range</TableHead>
                                      <TableHead>Gender</TableHead>
                                      <TableHead className="text-right">Lifetime spend</TableHead>
                                      <TableHead className="text-right">Lifetime impressions</TableHead>
                                      <TableHead className="text-right">Lifetime leads</TableHead>
                                      <TableHead className="text-right">Last 30 days spend</TableHead>
                                      <TableHead className="text-right">Last 30 days leads</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {breakdown.demographics.map((row) => (
                                      <TableRow key={`${row.ageRange}-${row.gender}`}>
                                        <TableCell className="text-muted-foreground">{row.ageRange}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {GENDER_LABELS[row.gender] ?? row.gender}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatMoney(Number(row.lifetimeSpend), campaign.currency)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {row.lifetimeImpressions.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{row.lifetimeLeads.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatMoney(Number(row.last30dSpend), campaign.currency)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{row.last30dLeads.toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-medium text-muted-foreground">By region</p>
                              {breakdown.regions.length === 0 ? (
                                <p className="text-sm text-faint">No regional data yet.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Region</TableHead>
                                      <TableHead className="text-right">Lifetime spend</TableHead>
                                      <TableHead className="text-right">Lifetime impressions</TableHead>
                                      <TableHead className="text-right">Lifetime leads</TableHead>
                                      <TableHead className="text-right">Last 30 days spend</TableHead>
                                      <TableHead className="text-right">Last 30 days leads</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {breakdown.regions.map((row) => (
                                      <TableRow key={row.region}>
                                        <TableCell className="text-muted-foreground">{row.region}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatMoney(Number(row.lifetimeSpend), campaign.currency)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {row.lifetimeImpressions.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{row.lifetimeLeads.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                          {formatMoney(Number(row.last30dSpend), campaign.currency)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{row.last30dLeads.toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-medium text-muted-foreground">Targeted cities</p>
                              {breakdown.cities.length === 0 ? (
                                <p className="text-sm text-faint">No city-level targeting on this campaign&apos;s ad sets.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {breakdown.cities.map((city) => (
                                    <Badge key={city.cityName + city.countryCode} variant="neutral">
                                      {city.cityName}
                                      {city.regionName ? `, ${city.regionName}` : ""}
                                      {city.countryCode ? ` (${city.countryCode})` : ""}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
