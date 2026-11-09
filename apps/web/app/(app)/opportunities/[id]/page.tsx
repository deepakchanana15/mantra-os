import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/domain/activity-timeline";
import { OpportunityStageEditor } from "@/components/domain/opportunity-stage-editor";
import { opportunityStageLabel } from "@/lib/opportunity-stages";
import { opportunitySourceLabel } from "@/lib/opportunity-source";

interface SalesOrderWithInvoices {
  id: string;
  status: string;
  salesChannel: string | null;
  onlineChannelType: string | null;
  offlineChannelType: string | null;
  orderReference: string | null;
  invoices: { id: string; invoiceNumber: string; status: string; amount: string }[];
}

interface Quote {
  id: string;
  status: string;
  salesOrder: SalesOrderWithInvoices | null;
}

interface Opportunity {
  id: string;
  code: string | null;
  name: string;
  stage: string;
  lostReason: string | null;
  estimatedValue: string | null;
  notes: string | null;
  source: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  customerType: string | null;
  productInterest: string | null;
  quotes: Quote[];
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await apiFetch<Opportunity>(`/v1/opportunities/${params.id}`);
  const salesOrders = opportunity.quotes.map((q) => q.salesOrder).filter((o): o is SalesOrderWithInvoices => o !== null);
  const contactName = opportunity.customer?.name ?? opportunity.leadName ?? "Unknown";
  const contactEmail = opportunity.customer?.email ?? opportunity.leadEmail;
  const contactPhone = opportunity.customer?.phone ?? opportunity.leadPhone;

  return (
    <div className="grid grid-cols-1 gap-5 p-7 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        <div>
          <Link href="/opportunities" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Opportunities
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{opportunity.name}</h1>
            <Badge variant="neutral">{opportunityStageLabel(opportunity.stage)}</Badge>
            <Badge variant="neutral">{opportunitySourceLabel(opportunity.source)}</Badge>
            {opportunity.code && <span className="font-mono text-xs text-faint">{opportunity.code}</span>}
          </div>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{opportunity.customer ? "Customer" : "Lead"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">{contactName}</p>
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="h-4 w-4 text-faint" />
              <span className="text-foreground">{contactEmail ?? "No email on file"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="h-4 w-4 text-faint" />
              <span className="text-foreground">{contactPhone ?? "No phone on file"}</span>
            </div>
            {(opportunity.customerType || opportunity.productInterest) && (
              <p className="text-xs text-faint">{[opportunity.customerType, opportunity.productInterest].filter(Boolean).join(" · ")}</p>
            )}
            {opportunity.customer && (
              <Link href={`/customers/${opportunity.customer.id}`} className="text-xs text-accent hover:underline">
                View customer record
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Stage &amp; value</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunityStageEditor
              opportunityId={opportunity.id}
              currentStage={opportunity.stage}
              currentLostReason={opportunity.lostReason}
              currentEstimatedValue={opportunity.estimatedValue}
              currentNotes={opportunity.notes}
            />
          </CardContent>
        </Card>

        {salesOrders.length > 0 && (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Sale details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {salesOrders.map((order) => {
                const channelParts = [order.salesChannel, order.onlineChannelType, order.offlineChannelType].filter(Boolean);
                return (
                  <div key={order.id} className="flex flex-col gap-1 text-sm">
                    <p className="font-medium text-foreground">
                      Sales order · {order.status}
                      {channelParts.length > 0 && <span className="text-muted-foreground"> ({channelParts.join(" · ")})</span>}
                    </p>
                    {order.orderReference && <p className="text-xs text-faint">Ref: {order.orderReference}</p>}
                    {order.invoices.map((inv) => (
                      <p key={inv.id} className="text-xs text-muted-foreground">
                        Invoice {inv.invoiceNumber} — {inv.status} — ${inv.amount}
                      </p>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-7 lg:h-[calc(100vh-3.5rem)]">
        <ActivityTimeline basePath={`/opportunities/${opportunity.id}`} />
      </div>
    </div>
  );
}
