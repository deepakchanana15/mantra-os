"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface SiteSetting {
  key: string;
  value: string | null;
}

export function StorefrontSettingsForm({ siteId }: { siteId: string }) {
  const [settings, setSettings] = useState<SiteSetting[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/storefront/sites/${siteId}/settings`);
    const data: SiteSetting[] = res.ok ? await res.json() : [];
    setSettings(data);
    setValues(Object.fromEntries(data.map((s) => [s.key, s.value ?? ""])));
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/storefront/sites/${siteId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: Object.entries(values).map(([key, value]) => ({ key, value })) }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't save settings.");
        return;
      }
      toast.success("Settings saved");
      load();
    } finally {
      setSaving(false);
    }
  }

  function addKey() {
    if (!newKey.trim() || newKey in values) return;
    setValues((v) => ({ ...v, [newKey.trim()]: "" }));
    setNewKey("");
  }

  if (settings === null) {
    return <p className="text-sm text-faint">Loading…</p>;
  }

  const keys = Object.keys(values);

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex flex-col gap-4 p-5">
        {keys.length === 0 ? (
          <p className="text-sm text-faint">No settings yet — add one below.</p>
        ) : (
          keys.map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`setting-${key}`}>{key}</Label>
              <Input
                id={`setting-${key}`}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </div>
          ))
        )}

        <div className="flex items-end gap-2 border-t border-border pt-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="newSettingKey">Add a setting key</Label>
            <Input id="newSettingKey" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. contact_email" />
          </div>
          <Button type="button" variant="outline" onClick={addKey}>
            Add
          </Button>
        </div>

        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
