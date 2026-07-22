"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_BOTTOM, NAV_GROUPS, NAV_TOP } from "./nav-config";
import { OrgSwitcher, type OrgSwitcherOrg } from "./org-switcher";

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground",
        active && "bg-accent-tint text-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 text-faint", active && "text-accent-hover")} />
      {label}
    </Link>
  );
}

export function Sidebar({ currentOrg, organizations }: { currentOrg: OrgSwitcherOrg; organizations: OrgSwitcherOrg[] }) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col gap-1 overflow-hidden border-r border-border bg-surface p-3">
      <div className="shrink-0">
        <OrgSwitcher currentOrg={currentOrg} organizations={organizations} />
      </div>

      <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        <NavLink {...NAV_TOP} />

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-3.5 flex flex-col gap-0.5">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex shrink-0 flex-col gap-0.5 border-t border-border pt-2">
        <NavLink {...NAV_BOTTOM} />
      </div>
    </aside>
  );
}
