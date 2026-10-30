import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { ConvertToCustomerButton } from "@/components/domain/convert-to-customer-button";
import { EditOpportunityButton } from "@/components/domain/edit-opportunity-button";
import { ExportCsvButton } from "@/components/domain/export-csv-button";
import { opportunityStageLabel } from "@/lib/opportunity-stages";
import { opportunityLostReasonLabel } from "@/lib/opportunity-lost-reasons";
import { OpportunitySortControl } from "./opportunity-sort-control";
import { OpportunitySearch } from "./opportunity-search";

interface Opportunity {
  id: string;
  code: string | null;
  name: string;
  stage: string;
  lostReason: string | null;
  estimatedValue: string | null;
  notes: string | null;
  customer: { name: string } | null;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  customerType: string | null;
  productInterest: string | null;
  source: string;
  createdAt: string;
  stageChangedAt: string;
}

interface OpportunitiesPage {
  data: Opportunity[];
  total: number;
  skip: number;
  take: number;
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  WEBSITE: "Website",
  META_LEAD_AD: "Meta lead ad",
  WHATSAPP: "WhatsApp",
};

const CLOSED_STAGES = new Set(["WON", "LOST"]);
const PAGE_SIZE = 50;
// Backend caps a single request's `take` at 100 — export pulls every page
// in that size until it has the full `total`, rather than assuming
// everything fits in one call.
const EXPORT_FETCH_SIZE = 100;

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function toExportRow(o: Opportunity) {
  return {
    ID: o.code ?? "",
    Name: o.name,
    "Customer / Lead": o.customer?.name ?? o.leadName ?? "",
    Email: o.customer ? "" : (o.leadEmail ?? ""),
    Phone: o.customer ? "" : (o.leadPhone ?? ""),
    Source: SOURCE_LABELS[o.source] ?? o.source,
    Stage: opportunityStageLabel(o.stage),
    "Lost Reason": o.lostReason ? opportunityLostReasonLabel(o.lostReason) : "",
    "Estimated Value": o.estimatedValue ?? "",
    "Created At": o.createdAt,
  };
}

/** Fetches every page at EXPORT_FETCH_SIZE so "Export" always covers every
 * matching opportunity, not just whatever page the table happens to be
 * showing — respects the current search filter, so exporting while a
 * search is active exports what's filtered, not the whole org. */
async function fetchAllForExport(sortBy: string, sortDir: string, search: string): Promise<Opportunity[]> {
  const qs = (skip: number) =>
    `skip=${skip}&take=${EXPORT_FETCH_SIZE}&sortBy=${sortBy}&sortDir=${sortDir}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const first = await apiFetch<OpportunitiesPage>(`/v1/opportunities?${qs(0)}`);
  const all = [...first.data];
  let fetched = first.data.length;
  while (fetched < first.total) {
    const next = await apiFetch<OpportunitiesPage>(`/v1/opportunities?${qs(fetched)}`);
    all.push(...next.data);
    fetched += next.data.length;
    if (next.data.length === 0) break; // safety net against an infinite loop if `total` is ever stale
  }
  return all;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { skip?: string; sortBy?: string; sortDir?: string; search?: string };
}) {
  const skip = Math.max(0, Number(searchParams.skip) || 0);
  const sortBy = searchParams.sortBy ?? "createdAt";
  const sortDir = searchParams.sortDir ?? "desc";
  const search = searchParams.search ?? "";
  const searchQs = search ? `&search=${encodeURIComponent(search)}` : "";

  const [page, exportRows] = await Promise.all([
    apiFetch<OpportunitiesPage>(`/v1/opportunities?skip=${skip}&take=${PAGE_SIZE}&sortBy=${sortBy}&sortDir=${sortDir}${searchQs}`),
    fetchAllForExport(sortBy, sortDir, search).then((rows) => rows.map(toExportRow)),
  ]);
  const { data: opportunities, total } = page;

  const rangeStart = total === 0 ? 0 : skip + 1;
  const rangeEnd = Math.min(skip + opportunities.length, total);
  const hasPrev = skip > 0;
  const hasNext = skip + opportunities.length < total;
  const prevSkip = Math.max(0, skip - PAGE_SIZE);
  const nextSkip = skip + PAGE_SIZE;
  const pageLink = (newSkip: number) => `/opportunities?skip=${newSkip}&sortBy=${sortBy}&sortDir=${sortDir}${searchQs}`;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground">{total} opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          <OpportunitySearch />
          <OpportunitySortControl />
          <ExportCsvButton
            rows={exportRows}
            filenamePrefix="opportunities"
            columns={["ID", "Name", "Customer / Lead", "Email", "Phone", "Source", "Stage", "Lost Reason", "Estimated Value", "Created At"]}
          />
          <Link href="/opportunities/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Opportunity
            </Button>
          </Link>
        </div>
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
              <TableHead>Age</TableHead>
              <TableHead>Estimated value</TableHead>
              <TableHead className="w-80" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-faint">
                  {search ? "No opportunities match your search." : "No opportunities yet."}
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map((opportunity) => {
                const leadName = opportunity.customer?.name ?? opportunity.leadName ?? "Unknown";
                const isClosed = CLOSED_STAGES.has(opportunity.stage);
                const stageDays = daysSince(opportunity.stageChangedAt);
                const ageDays = daysSince(opportunity.createdAt);
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
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{opportunityStageLabel(opportunity.stage)}</span>
                        {opportunity.lostReason && (
                          <span className="text-xs text-faint">{opportunityLostReasonLabel(opportunity.lostReason)}</span>
                        )}
                        <span className="text-xs text-faint">
                          {stageDays === 0 ? "changed today" : `${stageDays}d in this stage`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isClosed ? `Closed in ${ageDays}d` : `${ageDays}d pending`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {opportunity.estimatedValue ? `$${opportunity.estimatedValue}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditOpportunityButton
                          opportunityId={opportunity.id}
                          currentStage={opportunity.stage}
                          currentLostReason={opportunity.lostReason}
                          currentEstimatedValue={opportunity.estimatedValue}
                          currentNotes={opportunity.notes}
                        />
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

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={pageLink(prevSkip)}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
            )}
            {hasNext ? (
              <Link href={pageLink(nextSkip)}>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
