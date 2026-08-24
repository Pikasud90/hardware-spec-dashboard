"use client";

import * as React from "react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import type { ResolvedMetric } from "@/lib/metrics";
import { pearson } from "@/lib/stats";
import { ChartFrame } from "@/components/charts/chart-frame";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { divergingColor } from "@/lib/utils";
import { formatTrimmed } from "@/lib/format";

/**
 * Pearson correlation between every pair of analytic metrics in a category.
 *
 * This is the view that exposes structure rather than rankings — that core
 * count and package power move together, that process node runs inverse to
 * efficiency, that VRAM capacity and bus width are only loosely coupled once
 * large caches enter the picture.
 *
 * Correlation is signed, so the encoding is diverging: two hues with a neutral
 * (not coloured) midpoint at zero. A rainbow here would invent structure that
 * is not in the data.
 *
 * Correlations are computed pairwise-complete — a component missing one metric
 * drops out of that pair only, not the whole matrix.
 */
export function CorrelationMatrix({
  components,
  metrics,
  title = "Specification correlation matrix",
  maxMetrics = 12,
}: {
  components: ResolvedComponent[];
  metrics: ResolvedMetric[];
  title?: string;
  maxMetrics?: number;
}) {
  const { used, matrix } = React.useMemo(() => {
    // Keep metrics with enough coverage to correlate meaningfully.
    const viable = metrics.filter((metric) => {
      const values = components.map((component) => numericValue(component, metric.key));
      const present = values.filter((value) => value !== null);
      return present.length >= Math.max(4, components.length * 0.5) &&
        new Set(present).size > 1;
    });

    const chosen = viable.slice(0, maxMetrics);
    const series = chosen.map((metric) =>
      components.map((component) => numericValue(component, metric.key)),
    );

    const grid = chosen.map((_, row) =>
      chosen.map((__, column) =>
        row === column ? 1 : pearson(series[row], series[column]),
      ),
    );

    return { used: chosen, matrix: grid };
  }, [components, metrics, maxMetrics]);

  if (used.length < 3) {
    return (
      <ChartFrame title={title}>
        <EmptyState
          title="Not enough metrics with coverage"
          description="At least three metrics need values across most of the selection before correlations mean anything."
        />
      </ChartFrame>
    );
  }

  const gridTemplate = `minmax(8rem, 1fr) repeat(${used.length}, minmax(2.75rem, 1fr))`;

  return (
    <ChartFrame
      title={title}
      description="Pearson correlation between every pair of metrics across the current selection. Blue means the pair rises together; red means one rises as the other falls."
      note="Correlation is not causation, and these are engineering trade-offs rather than experiments. A strong negative correlation between process node and efficiency reflects that newer nodes are used for newer parts, not that the number itself causes the efficiency."
      readingGuide={[
        { label: "Each cell", text: "How strongly two specifications move together across every component in this category, from −1 to +1." },
        { label: "Blue", text: "Positive: as one rises, so does the other. Core count and power draw behave this way, because more cores need more power." },
        { label: "Red", text: "Negative: as one rises the other falls. Process node against efficiency is the clearest example." },
        { label: "Pale / grey", text: "Near zero — the two specifications vary independently, which is often the more interesting finding." },
        { label: "Strength", text: "Above 0.7 is strong, 0.4 to 0.7 moderate, below 0.4 weak. Read the number, not just the shade." },
        { label: "Caution", text: "This shows association, not cause. Two specifications can move together because both track a third thing — usually the release year." },
      ]}
      takeaway="Which specifications are effectively the same information, and which are genuinely independent axes worth trading off against each other."
      legend={
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span>−1 inverse</span>
          <span aria-hidden className="flex h-2.5 w-32 overflow-hidden rounded-full">
            {Array.from({ length: 21 }, (_, index) => {
              const value = (index - 10) / 10;
              return (
                <span
                  key={index}
                  className="h-full flex-1"
                  style={{ backgroundColor: divergingColor(value, 1) }}
                />
              );
            })}
          </span>
          <span>+1 aligned</span>
        </div>
      }
      table={{
        columns: [
          { key: "metric", label: "Metric" },
          ...used.map((metric) => ({ key: metric.key, label: metric.short, numeric: true })),
        ],
        rows: used.map((metric, row) => {
          const record: Record<string, string> = { metric: metric.label };
          used.forEach((other, column) => {
            const value = matrix[row][column];
            record[other.key] = value === null ? "—" : formatTrimmed(value, 2);
          });
          return record;
        }),
      }}
      minWidth={160 + used.length * 48}
    >
      <div className="text-xs">
        <div
          className="grid items-end gap-px pb-1"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="sticky left-0 z-10 bg-surface-1" />
          {used.map((metric) => (
            <div key={metric.key} className="flex justify-center pb-1">
              <span
                className="whitespace-nowrap text-[10px] text-ink-muted"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                title={metric.label}
              >
                {metric.short}
              </span>
            </div>
          ))}
        </div>

        {used.map((rowMetric, row) => (
          <div
            key={rowMetric.key}
            className="grid gap-px py-px"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-10 flex items-center bg-surface-1 pr-2">
              <span className="truncate text-[11px] text-ink-secondary" title={rowMetric.label}>
                {rowMetric.short}
              </span>
            </div>
            {used.map((columnMetric, column) => {
              const value = matrix[row][column];
              const diagonal = row === column;
              return (
                <Tooltip
                  key={columnMetric.key}
                  content={
                    <span>
                      <span className="block font-medium text-ink">
                        {rowMetric.label} × {columnMetric.label}
                      </span>
                      <span className="block">
                        r = {value === null ? "insufficient data" : formatTrimmed(value, 3)}
                      </span>
                      {value !== null && !diagonal && (
                        <span className="block text-ink-muted">
                          {Math.abs(value) > 0.7
                            ? "Strong"
                            : Math.abs(value) > 0.4
                              ? "Moderate"
                              : "Weak"}{" "}
                          {value > 0 ? "positive" : "negative"} association
                        </span>
                      )}
                    </span>
                  }
                >
                  <div
                    tabIndex={0}
                    className="tnum flex h-9 items-center justify-center rounded-[3px] text-[10px] text-ink hover:ring-2 hover:ring-accent-bright"
                    style={{
                      backgroundColor: diagonal
                        ? "var(--color-surface-3)"
                        : divergingColor(value, 1),
                    }}
                  >
                    {diagonal ? "—" : value === null ? "" : formatTrimmed(value, 2)}
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
