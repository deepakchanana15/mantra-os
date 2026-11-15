"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { label: "Settings", path: "settings" },
  { label: "Products", path: "products" },
  { label: "Categories", path: "categories" },
  { label: "Collections", path: "collections" },
  { label: "Blog", path: "blog" },
  { label: "Media", path: "media" },
];

export function StorefrontSubNav({ siteId }: { siteId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {SECTIONS.map((section) => {
        const href = `/websites/${siteId}/${section.path}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={section.path}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              isActive ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </div>
  );
}
