"use client";

import * as React from "react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { normalise } from "@/lib/stats";
import { ChartFrame, RampLegend } from "@/components/charts/chart-frame";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

/**
 * Normalised specification heatmap.
 *
 * Each cell is one component's value for one metric, min-max normalised
 * **within that metric row** and oriented by polarity, so a bright cell always
 * means "better here" — whether the underlying metric is core count (higher
 * wins) or true latency (lower wins). Comparing brightness across rows is
 * meaningless by construction and the row label says so; comparing along a row
 * is the whole point.
 *
 * Magnitude is a single-hue sequential ramp, never a rainbow. Every cell also
 * carries its real formatted value, so colour is a scanning aid rather than the
 * only encoding.
 */

/** Sequential step index 0-9, or null when the value is missing. */
function stepFor(unit: number | null): number | null {
  if (unit === null) return null;
  return Math.round(Math.min(1, Math.max(0, unit)) * 9);
}

const RAMP_STOPS = Array.from({ length: 10 }, (_, index) => `var(--color-seq-${index})`);

export function SpecHeatmap({
  components,
  metrics,
  title = "Normalised specification heatmap",
  description,
}: {
  components: ResolvedComponent[];
  metrics: ResolvedMetric[];
  title?: string;
  description?: string;
}) {
  const rows = React.useMemo(
    () =>
      metrics
        .map((metric) => {
          const raw = components.map((component) => numericValue(component, metric.key));
          const present = raw.filter((value) => value !== null);
          return {
            metric,
            raw,
            // A row where every component is missing the metric, or where all
            // values are identical, tells the reader nothing — drop it.
            usable: present.length >= 2 && new Set(present).size > 1,
            units: raw.map((value) => normalise(value, raw, metric.polarity)),
          };
        })
        .filter((row) => row.usable),
    [components, metrics],
  );

  const tableRows = React.useMemo(
    () =>
      rows.map((row) => {
        const record: Record<string, string> = { metric: row.metric.label };
        components.forEach((component, index) => {
          record[component.id] = formatMetricValue(row.metric, row.raw[index]);
        });
        return record;
      }),
    [rows, components],
  );

  const gridTemplate = `minmax(11rem, 1.4fr) repeat(${components.length}, minmax(6.5rem, 1fr))`;

  return (
    <ChartFrame
      title={title}
      description={
        description ??
        "Each row is normalised independently and oriented so brighter always means better for that metric. Read along rows, not down columns."
      }
      note="Rows where every component shares the same value, or where fewer than two values exist, are omitted — they carry no comparative information."
      legend={
        <>
          <RampLegend
            label="Within each row:"
            from="worst"
            to="best"
            stops={RAMP_STOPS}
          />
          <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px] border border-edge-strong bg-surface-2"
            />
            not specified
          </span>
        </>
      }
      table={{
        columns: [
          { key: "metric", label: "Metric" },
          ...components.map((component) => ({
            key: component.id,
            label: component.name,
            numeric: true,
          })),
        ],
        rows: tableRows,
      }}
      empty={
        rows.length === 0 ? (
          <EmptyState
            title="Nothing to plot"
            description="These components share identical values across every comparable metric, so a heatmap would be uniform."
          />
        ) : undefined
      }
      minWidth={220 + components.length * 110}
    >
      <div role="table" aria-label={title} className="text-xs">
        <div
          role="row"
          className="grid items-end gap-px pb-1"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div role="columnheader" className="sticky left-0 z-10 bg-surface-1 pr-2" />
          {components.map((component) => (
            <div
              role="columnheader"
              key={component.id}
              className="px-1 pb-1 text-center text-[11px] font-medium leading-tight text-ink-secondary"
            >
              <span className="line-clamp-2" title={component.name}>
                {component.name}
              </span>
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div
            role="row"
            key={row.metric.key}
            className="grid gap-px py-px"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div
              role="rowheader"
              className="sticky left-0 z-10 flex items-center bg-surface-1 pr-3"
            >
              <Tooltip content={row.metric.description}>
                <span className="cursor-help truncate text-[11px] text-ink-secondary">
                  {row.metric.label}
                  <span className="ml-1 text-ink-muted">
                    {row.metric.polarity === "LOWER_BETTER" ? "↓" : "↑"}
                  </span>
                </span>
              </Tooltip>
            </div>
            {components.map((component, index) => {
              const step = stepFor(row.units[index]);
              const display = formatMetricValue(row.metric, row.raw[index]);
              return (
                <Tooltip
                  key={component.id}
                  content={
                    <span>
                      <span className="block font-medium text-ink">{component.name}</span>
                      <span className="block">
                        {row.metric.label}: {display}
                      </span>
                      <span className="block text-ink-muted">
                        {row.metric.polarity === "LOWER_BETTER"
                          ? "Lower is better"
                          : "Higher is better"}
                      </span>
                    </span>
                  }
                >
                  <div
                    role="cell"
                    tabIndex={0}
                    className={cn(
                      "tnum flex h-8 items-center justify-center rounded-[3px] px-1 text-center text-[11px] leading-none transition-transform",
                      step === null &&
                        "border border-dashed border-edge-strong bg-surface-2 text-ink-muted",
                      "hover:z-20 hover:ring-2 hover:ring-accent",
                    )}
                    style={
                      step === null
                        ? undefined
                        : {
                            backgroundColor: `var(--color-seq-${step})`,
                            // Each ramp step carries its own paired ink, so the
                            // label stays readable whichever theme is active.
                            color: `var(--color-seq-ink-${step})`,
                          }
                    }
                  >
                    <span className="truncate">{display}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
