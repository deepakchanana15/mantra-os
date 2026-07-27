import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { CreateSegmentDialog } from "./create-segment-dialog";
import { CreateTemplateDialog } from "./create-template-dialog";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import { SendCampaignButton } from "./send-campaign-button";

interface Segment {
  id: string;
  name: string;
  filterJson: { customerType?: string };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface Campaign {
  id: string;
  status: string;
  sentAt: string | null;
  segment: { name: string };
  template: { name: string };
  stats: { sent?: number; delivered?: number; opened?: number; clicked?: number; bounced?: number } | null;
}

interface AdCampaign {
  id: string;
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
  last30dSpend: string;
  last30dImpressions: number;
  last30dClicks: number;
  lastSyncedAt: string | null;
}

function rate(count: number | undefined, of: number | undefined): string {
  if (!count || !of) return "—";
  return `${Math.round((count / of) * 100)}%`;
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

const CAMPAIGN_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  SENDING: "warning",
  SENT: "success",
  CANCELLED: "destructive",
};

export default async function MarketingPage() {
  const [segments, templates, campaigns, adCampaigns] = await Promise.all([
    apiFetch<Segment[]>("/v1/segments"),
    apiFetch<EmailTemplate[]>("/v1/email-templates"),
    apiFetch<Campaign[]>("/v1/campaigns"),
    apiFetch<AdCampaign[]>("/v1/marketing-integrations/campaigns"),
  ]);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm text-muted-foreground">Email campaigns to your CRM segments, sent via Brevo.</p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="ad-campaigns">Ad Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="mb-3 flex justify-end">
            <CreateCampaignDialog segments={segments} templates={templates} />
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-faint">
                      No campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="text-foreground">{campaign.segment.name}</TableCell>
                      <TableCell className="text-muted-foreground">{campaign.template.name}</TableCell>
                      <TableCell>
                        <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status] ?? "neutral"}>{campaign.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{campaign.stats?.sent ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {campaign.stats?.opened ?? 0} ({rate(campaign.stats?.opened, campaign.stats?.delivered)})
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {campaign.stats?.clicked ?? 0} ({rate(campaign.stats?.clicked, campaign.stats?.delivered)})
                      </TableCell>
                      <TableCell>
                        {campaign.status === "DRAFT" || campaign.status === "SCHEDULED" ? (
                          <SendCampaignButton campaignId={campaign.id} />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ad-campaigns">
          <p className="mb-3 text-sm text-muted-foreground">
            Every campaign ever run on a connected ad platform — a permanent archive, not filtered by status or age.
            Connect a platform in Settings → Integrations.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableHead className="text-right">Last 30 days spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-sm text-faint">
                      No ad-platform campaigns synced yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  adCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
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
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(campaign.last30dSpend), campaign.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="segments">
          <div className="mb-3 flex justify-end">
            <CreateSegmentDialog />
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Filter</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-faint">
                      No segments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium text-foreground">{segment.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {segment.filterJson.customerType ? `Type: ${segment.filterJson.customerType}` : "Any customer"}
                      </TableCell>
                      <TableCell>
                        <DeleteEntityButton apiPath={`/api/v1/segments/${segment.id}`} entityLabel="Segment" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="mb-3 flex justify-end">
            <CreateTemplateDialog />
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-faint">
                      No templates yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-foreground">{template.name}</TableCell>
                      <TableCell className="text-muted-foreground">{template.subject}</TableCell>
                      <TableCell>
                        <DeleteEntityButton apiPath={`/api/v1/email-templates/${template.id}`} entityLabel="Template" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
