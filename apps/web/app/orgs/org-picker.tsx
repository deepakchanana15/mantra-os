"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrgPicker({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function selectOrg(organizationId: string) {
    setLoadingId(organizationId);
    try {
      await fetch("/api/org/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {organizations.map((org) => (
        <Button
          key={org.id}
          variant="outline"
          disabled={loadingId !== null}
          onClick={() => selectOrg(org.id)}
          className="justify-start"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            {org.name.slice(0, 2).toUpperCase()}
          </span>
          {loadingId === org.id ? "Opening…" : org.name}
        </Button>
      ))}
    </div>
  );
}
