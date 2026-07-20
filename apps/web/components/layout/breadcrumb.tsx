"use client";

import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS, NAV_GROUPS, NAV_TOP } from "./nav-config";

/** Auto-derived from the current path against nav-config — pages never need to pass their own breadcrumb. */
export function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === NAV_TOP.href) {
    return <span className="font-medium text-foreground">{NAV_TOP.label}</span>;
  }

  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
    if (item) {
      return (
        <span>
          {group.label} <span className="mx-1 text-faint">/</span>{" "}
          <span className="font-medium text-foreground">{item.label}</span>
        </span>
      );
    }
  }

  const fallback = ALL_NAV_ITEMS.find((i) => pathname.startsWith(i.href));
  return <span className="font-medium text-foreground">{fallback?.label ?? "MantraOS"}</span>;
}
