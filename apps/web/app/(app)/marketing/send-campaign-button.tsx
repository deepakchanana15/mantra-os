"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SendCampaignButton({ campaignId, disabled }: { campaignId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't send the campaign.");
        return;
      }
      toast.success("Campaign sent");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled || loading} onClick={handleSend}>
      <Send className="h-3.5 w-3.5" />
      {loading ? "Sending…" : "Send"}
    </Button>
  );
}
