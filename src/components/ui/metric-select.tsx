"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { ResolvedMetric } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * Native select for choosing a metric.
 *
 * Deliberately a real `<select>`: it is keyboard-accessible everywhere for
 * free, renders the platform picker on touch devices, and needs no portal —
 * all of which matter more here than a custom listbox would.
 */
export function MetricSelect({
  label,
  metrics,
  value,
  onChange,
  className,
}: {
  label: string;
  metrics: ResolvedMetric[];
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const id = React.useId();
  const grouped = React.useMemo(() => {
    const groups = new Map<string, ResolvedMetric[]>();
    for (const metric of metrics) {
      const existing = groups.get(metric.group);
      if (existing) existing.push(metric);
      else groups.set(metric.group, [metric]);
    }
    return [...groups.entries()];
  }, [metrics]);

  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-muted"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-edge bg-surface-2 pl-3 pr-8 text-sm text-ink outline-none transition-colors focus:border-accent"
        >
          {grouped.map(([group, entries]) => (
            <optgroup key={group} label={group}>
              {entries.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                  {metric.unit ? ` (${metric.unit})` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}
