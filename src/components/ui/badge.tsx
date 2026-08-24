import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-edge-strong bg-surface-2 text-ink-secondary",
        accent: "border-accent/40 bg-accent/12 text-accent-bright",
        good: "border-good/45 bg-good/12 text-good",
        critical: "border-critical/45 bg-critical/12 text-critical",
        warning: "border-warning/45 bg-warning/12 text-warning",
        outline: "border-edge bg-transparent text-ink-muted",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
