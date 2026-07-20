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
  stats: { sent?: number } | null;
}

const CAMPAIGN_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  SENDING: "warning",
  SENT: "success",
  CANCELLED: "destructive",
};

export default async function MarketingPage() {
  const [segments, templates, campaigns] = await Promise.all([
    apiFetch<Segment[]>("/v1/segments"),
    apiFetch<EmailTemplate[]>("/v1/email-templates"),
    apiFetch<Campaign[]>("/v1/campaigns"),
  ]);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm text-muted-foreground">Email campaigns to your CRM segments, sent via Resend.</p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
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
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
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
