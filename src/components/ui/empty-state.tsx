import * as React from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown whenever a filter combination yields nothing (US7).
 *
 * The rule this component enforces: an empty state always offers the action
 * that undoes the emptiness. A dead end with no escape is a bug, not a state.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-edge-strong bg-surface-1/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="rounded-full border border-edge bg-surface-2 p-3 text-ink-muted">
        {icon ?? <SearchX className="size-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
