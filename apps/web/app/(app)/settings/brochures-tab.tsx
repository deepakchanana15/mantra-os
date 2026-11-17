"use client";

import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Company {
  id: string;
  name: string;
  baseCurrencyId: string | null;
  brochureUrl: string | null;
  brochureUrlEn: string | null;
  blogUrl: string | null;
  countries: { defaultLanguage: string | null }[];
}

interface Currency {
  id: string;
  code: string;
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", de: "German", nl: "Dutch" };

function companyLanguage(company: Company): string {
  return company.countries[0]?.defaultLanguage ?? "en";
}

function currencyCode(currencies: Currency[], id: string | null): string {
  return currencies.find((c) => c.id === id)?.code ?? "—";
}

/**
 * One brochure per site (its own language + currency), rather than one set
 * per organization — a CAD/English brochure isn't right for a USD or EUR
 * market. Non-English sites (DE, NL) additionally get an English fallback;
 * sites sharing a currency can point that fallback at the same uploaded
 * file instead of duplicating it. Everything PATCHes Company.brochureUrl /
 * brochureUrlEn via Vercel Blob — never a code change to replace a file.
 */
export function BrochuresTab({ companies, currencies }: { companies: Company[]; currencies: Currency[] }) {
  const [files, setFiles] = useState<Record<string, { brochureUrl: string | null; brochureUrlEn: string | null }>>(
    () => Object.fromEntries(companies.map((c) => [c.id, { brochureUrl: c.brochureUrl, brochureUrlEn: c.brochureUrlEn }])),
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [blogUrls, setBlogUrls] = useState<Record<string, string | null>>(
    () => Object.fromEntries(companies.map((c) => [c.id, c.blogUrl])),
  );
  const [savingBlogUrlFor, setSavingBlogUrlFor] = useState<string | null>(null);

  const nonEnglishByCurrency = new Map<string, Company[]>();
  for (const c of companies) {
    if (companyLanguage(c) === "en") continue;
    const key = c.baseCurrencyId ?? "none";
    nonEnglishByCurrency.set(key, [...(nonEnglishByCurrency.get(key) ?? []), c]);
  }

  async function patchCompanies(
    ids: string[],
    data: { brochureUrl?: string | null; brochureUrlEn?: string | null; blogUrl?: string | null },
  ) {
    for (const id of ids) {
      const res = await fetch(`/api/v1/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Couldn't save the brochure.");
      }
    }
  }

  async function handleUpload(
    uploadKey: string,
    companyIds: string[],
    field: "brochureUrl" | "brochureUrlEn",
    file: File,
  ) {
    setUploading(uploadKey);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/brochure-upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message ?? "Upload failed.");
      }
      await patchCompanies(companyIds, { [field]: uploadData.url });
      setFiles((prev) => {
        const next = { ...prev };
        for (const id of companyIds) next[id] = { ...next[id], [field]: uploadData.url };
        return next;
      });
      toast.success("Brochure updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(uploadKey: string, companyIds: string[], field: "brochureUrl" | "brochureUrlEn") {
    setUploading(uploadKey);
    try {
      await patchCompanies(companyIds, { [field]: null });
      setFiles((prev) => {
        const next = { ...prev };
        for (const id of companyIds) next[id] = { ...next[id], [field]: null };
        return next;
      });
      toast.success("Brochure removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove the brochure.");
    } finally {
      setUploading(null);
    }
  }

  async function handleBlogUrlBlur(companyId: string, value: string) {
    const normalized = value.trim();
    if ((blogUrls[companyId] ?? "") === normalized) return;

    setSavingBlogUrlFor(companyId);
    try {
      await patchCompanies([companyId], { blogUrl: normalized || null });
      setBlogUrls((prev) => ({ ...prev, [companyId]: normalized || null }));
      toast.success("Blog link updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the blog link.");
    } finally {
      setSavingBlogUrlFor(null);
    }
  }

  function UploadRow({
    uploadKey,
    label,
    url,
    companyIds,
    field,
  }: {
    uploadKey: string;
    label: string;
    url: string | null;
    companyIds: string[];
    field: "brochureUrl" | "brochureUrlEn";
  }) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
        <div className="flex items-center gap-2.5 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-faint" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{label}</span>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                View current file
              </a>
            ) : (
              <span className="text-xs text-faint">Not uploaded yet</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <Button type="button" variant="outline" size="sm" disabled={uploading === uploadKey} asChild>
              <span className="cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {uploading === uploadKey ? "Uploading…" : url ? "Replace" : "Upload"}
              </span>
            </Button>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(uploadKey, companyIds, field, file);
                e.target.value = "";
              }}
            />
          </label>
          {url && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading !== null}
              onClick={() => void handleRemove(uploadKey, companyIds, field)}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderedSharedGroups = new Set<string>();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        The PDF sent to B2B leads who submit a wholesale/contact enquiry on each site, and the blog link sent to
        everyone else's general enquiries. Every site has its own brochure (its own language and currency) and its
        own blog link — update either here any time, no code change needed.
      </p>
      {companies.map((company) => {
        const lang = companyLanguage(company);
        const langLabel = LANGUAGE_NAMES[lang] ?? lang;
        const currency = currencyCode(currencies, company.baseCurrencyId);
        const group = lang !== "en" ? nonEnglishByCurrency.get(company.baseCurrencyId ?? "none") : undefined;
        const sharedKey = group ? `en:${company.baseCurrencyId ?? "none"}` : null;
        const showShared = Boolean(sharedKey && !renderedSharedGroups.has(sharedKey));
        if (sharedKey) renderedSharedGroups.add(sharedKey);

        return (
          <Card key={company.id}>
            <CardHeader>
              <CardTitle className="text-base">{company.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <UploadRow
                uploadKey={`${company.id}:primary`}
                label={`${langLabel} (${currency})`}
                url={files[company.id]?.brochureUrl ?? null}
                companyIds={[company.id]}
                field="brochureUrl"
              />
              {showShared && group && (
                <UploadRow
                  uploadKey={`shared-en:${sharedKey}`}
                  label={
                    group.length > 1
                      ? `English (${currency}) — shared with ${group
                          .filter((c) => c.id !== company.id)
                          .map((c) => c.name)
                          .join(", ")}`
                      : `English (${currency})`
                  }
                  url={files[company.id]?.brochureUrlEn ?? null}
                  companyIds={group.map((c) => c.id)}
                  field="brochureUrlEn"
                />
              )}
              <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
                <Label htmlFor={`blog-url-${company.id}`} className="text-xs font-medium text-foreground">
                  Blog link (for the general-enquiry welcome email)
                </Label>
                <Input
                  id={`blog-url-${company.id}`}
                  key={company.id + (blogUrls[company.id] ?? "")}
                  defaultValue={blogUrls[company.id] ?? ""}
                  placeholder="https://..."
                  disabled={savingBlogUrlFor === company.id}
                  onBlur={(e) => handleBlogUrlBlur(company.id, e.target.value)}
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
