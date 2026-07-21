import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  estimatedValue: string | null;
  customer: { name: string };
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
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
              <TableHead>Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Estimated value</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                  No opportunities yet.
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell className="font-medium text-foreground">{opportunity.name}</TableCell>
                  <TableCell className="text-muted-foreground">{opportunity.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{STAGE_LABELS[opportunity.stage] ?? opportunity.stage}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {opportunity.estimatedValue ? `$${opportunity.estimatedValue}` : "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/opportunities/${opportunity.id}`} entityLabel="Opportunity" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
