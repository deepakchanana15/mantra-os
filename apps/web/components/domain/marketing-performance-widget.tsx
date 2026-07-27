import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface MarketingCampaignStat {
  channel: string;
  campaignName: string;
  status: string | null;
  spend: number;
  impressions: number;
  clicks: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  META: "Meta",
  GOOGLE: "Google Ads",
  BING: "Bing/Microsoft Ads",
};

/**
 * Shown on both Dashboard and Reports — see ARCHITECTURE.md "Reports and
 * Dashboard are not domains". One row per campaign (not per channel — see
 * DECISIONS.md "Per-campaign ad performance, not channel-consolidated"),
 * scoped to the platform's own rolling last-30-day totals. Only campaigns
 * with recent activity appear here — the full campaign archive (including
 * older/paused ones) lives on the Campaigns page.
 */
export function MarketingPerformanceWidget({ marketingPerformance }: { marketingPerformance: MarketingCampaignStat[] }) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Marketing performance (last 30 days)</div>
        {marketingPerformance.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">
            No ad-platform activity in the last 30 days — connect one in Settings → Integrations.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingPerformance.map((stat) => (
                <TableRow key={`${stat.channel}-${stat.campaignName}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">{stat.campaignName}</span>
                      <span className="text-xs text-faint">{CHANNEL_LABELS[stat.channel] ?? stat.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{currency.format(stat.spend)}</TableCell>
                  <TableCell className="text-right tabular-nums">{stat.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{stat.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {stat.impressions > 0 ? `${((stat.clicks / stat.impressions) * 100).toFixed(2)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
