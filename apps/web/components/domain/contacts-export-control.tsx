"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Lets a country be picked before downloading, so a marketing push for one
 * market doesn't accidentally hand you everyone mixed together. Omitting
 * the param (the "All countries" default) keeps the old unfiltered export.
 */
export function ContactsExportControl({ countries }: { countries: { isoCode: string; name: string }[] }) {
  const [country, setCountry] = useState("");

  const href = country
    ? `/api/v1/contacts-export/vcard?country=${encodeURIComponent(country)}`
    : "/api/v1/contacts-export/vcard";

  return (
    <div className="flex items-center gap-2">
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-foreground"
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {c.name}
          </option>
        ))}
      </select>
      <Button variant="outline" size="sm" asChild>
        <a href={href} download>
          Export contacts (.vcf)
        </a>
      </Button>
    </div>
  );
}
