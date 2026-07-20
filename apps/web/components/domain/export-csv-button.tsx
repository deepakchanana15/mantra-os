"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Rows and columns must be plain serializable data (strings), never
 * functions — this is used from Server Components, and React Server
 * Components cannot pass functions to Client Components across that
 * boundary. Server Component callers pre-map their data into
 * Record<string,string> rows before handing them here. See DECISIONS.md
 * for the bug this fixes (found via verify-frontend-e2e.js).
 */
export function ExportCsvButton({
  rows,
  columns,
  filenamePrefix,
}: {
  rows: Record<string, string>[];
  columns: string[];
  filenamePrefix: string;
}) {
  function handleExport() {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = columns.map(escape).join(",");
    const lines = rows.map((row) => columns.map((col) => escape(row[col] ?? "")).join(","));
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
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
