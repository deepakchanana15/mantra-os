"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
}

function toCsv(rows: Customer[]): string {
  const header = ["Name", "Type", "Email", "Phone"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [r.name, r.type, r.email ?? "", r.phone ?? ""].map(escape).join(","));
  return [header.join(","), ...lines].join("\n");
}

export function ExportCustomersButton({ customers }: { customers: Customer[] }) {
  function handleExport() {
    const csv = toCsv(customers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="ghost" size="sm" className="border border-border" onClick={handleExport}>
      <Download className="h-3.5 w-3.5" />
      Export
    </Button>
  );
}
