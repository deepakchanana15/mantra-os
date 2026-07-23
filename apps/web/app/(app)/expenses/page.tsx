import Link from "next/link";
import { Paperclip, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Expense {
  id: string;
  vendorName: string;
  category: string;
  amount: string;
  expenseDate: string;
  attachments: { id: string; fileUrl: string; fileName: string }[];
  goodsReceipt: { id: string } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  GOODS_RECEIPT: "Goods receipt",
  RENT: "Rent",
  UTILITIES: "Utilities",
  SALARIES: "Salaries",
  SHIPPING: "Shipping",
  MARKETING: "Marketing",
  OFFICE_SUPPLIES: "Office supplies",
  PROFESSIONAL_SERVICES: "Professional services",
  OTHER: "Other",
};

export default async function ExpensesPage() {
  const expenses = await apiFetch<Expense[]>("/v1/expenses");
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code" });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">{expenses.length} expenses</p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Expense
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-faint">
                  No expenses yet — record one from a Goods Receipt, or add one directly.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium text-foreground">{expense.vendorName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {CATEGORY_LABELS[expense.category] ?? expense.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{currency.format(Number(expense.amount))}</TableCell>
                  <TableCell>
                    {expense.attachments.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {expense.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-fit items-center gap-1 text-accent hover:underline"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {attachment.fileName}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                    {expense.goodsReceipt && (
                      <Link
                        href={`/goods-receipts/${expense.goodsReceipt.id}`}
                        className="ml-2 text-muted-foreground hover:text-accent hover:underline"
                      >
                        Receipt
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/expenses/${expense.id}`} entityLabel="Expense" />
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
