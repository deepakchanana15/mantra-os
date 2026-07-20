"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Option {
  id: string;
  name: string;
}

export function CreateCampaignDialog({ segments, templates }: { segments: Option[]; templates: Option[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [segmentId, setSegmentId] = useState<string | undefined>(undefined);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segmentId || !templateId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId, templateId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't create the campaign.");
        return;
      }
      toast.success("Campaign created as a draft");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const selectedSegment = segments.find((s) => s.id === segmentId);
  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Segment</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedSegment?.name ?? "Select a segment"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {segments.map((s) => (
                  <DropdownMenuItem key={s.id} onSelect={() => setSegmentId(s.id)}>
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email template</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-start">
                  {selectedTemplate?.name ?? "Select a template"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {templates.map((t) => (
                  <DropdownMenuItem key={t.id} onSelect={() => setTemplateId(t.id)}>
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !segmentId || !templateId}>
              {loading ? "Creating…" : "Create draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
