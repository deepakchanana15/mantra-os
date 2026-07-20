"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ALL_NAV_ITEMS } from "./nav-config";

export const OPEN_COMMAND_PALETTE_EVENT = "mantraos:open-command-palette";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    // Decouples the topbar's search pill from this component — it just
    // dispatches this event rather than needing shared state/context.
    function handleOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {ALL_NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              <item.icon className="h-4 w-4 text-faint" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
