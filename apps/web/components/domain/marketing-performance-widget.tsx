import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface MarketingChannelStat {
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  META: "Meta (Facebook/Instagram)",
  GOOGLE: "Google Ads",
  BING: "Bing/Microsoft Ads",
};

/** Shown on both Dashboard and Reports — see ARCHITECTURE.md "Reports and Dashboard are not domains". Populated by the daily ad-platform sync, see DECISIONS.md "Ad platform integrations, Phase 1: Meta". */
export function MarketingPerformanceWidget({ marketingPerformance }: { marketingPerformance: MarketingChannelStat[] }) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Marketing performance (MTD)</div>
        {marketingPerformance.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">
            No ad-platform data yet — connect one in Settings → Integrations.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingPerformance.map((stat) => (
                <TableRow key={stat.channel}>
                  <TableCell className="text-foreground">{CHANNEL_LABELS[stat.channel] ?? stat.channel}</TableCell>
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
