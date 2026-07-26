import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { ConvertToCustomerButton } from "@/components/domain/convert-to-customer-button";

interface Opportunity {
  id: string;
  code: string | null;
  name: string;
  stage: string;
  estimatedValue: string | null;
  customer: { name: string } | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  customerType: string | null;
  productInterest: string | null;
  source: string;
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  WEBSITE: "Website",
  META_LEAD_AD: "Meta lead ad",
  WHATSAPP: "WhatsApp",
};

export default async function OpportunitiesPage() {
  const opportunities = await apiFetch<Opportunity[]>("/v1/opportunities");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground">{opportunities.length} opportunities</p>
        </div>
        <Link href="/opportunities/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Opportunity
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Customer / Lead</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Estimated value</TableHead>
              <TableHead className="w-64" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-faint">
                  No opportunities yet.
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map((opportunity) => {
                const leadName = opportunity.customer?.name ?? opportunity.leadName ?? "Unknown";
                return (
                  <TableRow key={opportunity.id}>
                    <TableCell className="font-mono text-xs text-faint">{opportunity.code ?? "—"}</TableCell>
                    <TableCell className="font-medium text-foreground">{opportunity.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {opportunity.customer ? (
                        opportunity.customer.name
                      ) : (
                        <div className="flex flex-col">
                          <span>{opportunity.leadName ?? "—"}</span>
                          <span className="text-xs text-faint">
                            {[opportunity.leadEmail, opportunity.leadPhone].filter(Boolean).join(" · ")}
                          </span>
                          {(opportunity.customerType || opportunity.productInterest) && (
                            <span className="text-xs text-faint">
                              {[opportunity.customerType, opportunity.productInterest].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{SOURCE_LABELS[opportunity.source] ?? opportunity.source}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{STAGE_LABELS[opportunity.stage] ?? opportunity.stage}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {opportunity.estimatedValue ? `$${opportunity.estimatedValue}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {opportunity.customer ? (
                          <Link href={`/quotes/new?opportunityId=${opportunity.id}`}>
                            <Button variant="outline" size="sm">
                              <FileText className="h-3.5 w-3.5" />
                              Create Quote
                            </Button>
                          </Link>
                        ) : (
                          <ConvertToCustomerButton opportunityId={opportunity.id} leadName={leadName} />
                        )}
                        <DeleteEntityButton apiPath={`/api/v1/opportunities/${opportunity.id}`} entityLabel="Opportunity" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
