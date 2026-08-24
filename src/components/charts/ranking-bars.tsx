"use client";

import * as React from "react";
import Link from "next/link";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { makeColorScale, OTHER_COLOR, cn } from "@/lib/utils";

/**
 * Ranked bars for a single metric across a whole category.
 *
 * Ordering is polarity-aware, so "top" means best rather than largest. Bars
 * are measured from zero so length stays proportional, and every bar carries
 * its own value as a direct label rather than relying on an axis.
 */
export function RankingBars({
  components,
  metric,
  limit = 15,
  highlightIds,
  title,
}: {
  components: ResolvedComponent[];
  metric: ResolvedMetric;
  limit?: number;
  highlightIds?: readonly string[];
  title?: string;
}) {
  const { ranked, max, colorScale } = React.useMemo(() => {
    const withValues = components
      .map((component) => ({ component, value: numericValue(component, metric.key) }))
      .filter((entry): entry is { component: ResolvedComponent; value: number } =>
        entry.value !== null,
      );

    withValues.sort((a, b) =>
      metric.polarity === "LOWER_BETTER" ? a.value - b.value : b.value - a.value,
    );

    const top = withValues.slice(0, limit);

    const counts = new Map<string, number>();
    for (const entry of top) {
      counts.set(entry.component.brand, (counts.get(entry.component.brand) ?? 0) + 1);
    }

    return {
      ranked: top,
      max: Math.max(...top.map((entry) => Math.abs(entry.value)), 0),
      colorScale: makeColorScale(
        [...counts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([brand]) => brand),
        8,
      ),
    };
  }, [components, metric, limit]);

  const heading = title ?? `Top ${Math.min(limit, ranked.length)} by ${metric.label}`;

  if (ranked.length === 0) {
    return (
      <ChartFrame title={heading}>
        <EmptyState
          title="No values available"
          description={`No component in this selection specifies ${metric.label}.`}
        />
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={heading}
      description={`Ranked with ${metric.polarity === "LOWER_BETTER" ? "lower" : "higher"} treated as better, across ${components.length} components.`}
      note={metric.formula ? `Derived as: ${metric.formula}` : metric.description}
      readingGuide={[
        { label: "Order", text: "Best first, using the metric's own direction — for a lower-is-better metric like cost per watt or latency, the smallest value ranks first." },
        { label: "Bar length", text: "Proportional to the value, measured from zero." },
        { label: "Bar colour", text: "The brand, so concentrations at the top or bottom of a ranking are visible at a glance." },
        { label: "Value", text: "Printed at the end of every bar in real units — the bar is for scanning, the number is the fact." },
        { label: "Caution", text: "A ranking on one metric is not a ranking overall. A component can top the cost-per-watt table and be a poor choice for other reasons entirely." },
      ]}
      takeaway="Where each component places on a single specification across the whole category, and whether one brand dominates that measure."
      legend={
        <>
          {colorScale.domain.map((brand) => (
            <LegendItem key={brand} color={colorScale.of(brand)} label={brand} />
          ))}
          {colorScale.hasOther && <LegendItem color={OTHER_COLOR} label="Other brands" />}
        </>
      }
      table={{
        columns: [
          { key: "rank", label: "#", numeric: true },
          { key: "name", label: "Component" },
          { key: "brand", label: "Brand" },
          { key: "value", label: metric.label, numeric: true },
        ],
        rows: ranked.map((entry, index) => ({
          rank: index + 1,
          name: entry.component.name,
          brand: entry.component.brand,
          value: formatMetricValue(metric, entry.value),
        })),
      }}
    >
      <ol className="space-y-1.5">
        {ranked.map((entry, index) => {
          const width = max > 0 ? Math.max(1.5, (Math.abs(entry.value) / max) * 100) : 0;
          const emphasised = highlightIds?.includes(entry.component.id) === true;
          return (
            <li key={entry.component.id} className="flex items-center gap-2 text-xs">
              <span className="tnum w-5 shrink-0 text-right text-[10px] text-ink-muted">
                {index + 1}
              </span>
              <Link
                href={`/component/${entry.component.slug}/`}
                className={cn(
                  "w-40 shrink-0 truncate transition-colors hover:text-accent-strong sm:w-56",
                  emphasised ? "font-semibold text-ink" : "text-ink-secondary",
                )}
              >
                {entry.component.name}
              </Link>
              <span className="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-surface-2">
                <span
                  className="absolute inset-y-0 left-0 rounded-[4px]"
                  style={{
                    width: `${width}%`,
                    backgroundColor: colorScale.of(entry.component.brand),
                  }}
                />
              </span>
              <span className="tnum w-24 shrink-0 text-right text-ink">
                {formatMetricValue(metric, entry.value)}
              </span>
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}
