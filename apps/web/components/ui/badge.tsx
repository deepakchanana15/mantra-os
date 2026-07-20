import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      success: "bg-success-bg text-success",
      warning: "bg-warning-bg text-warning",
      destructive: "bg-destructive-bg text-destructive",
      neutral: "bg-surface-secondary text-muted-foreground",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
