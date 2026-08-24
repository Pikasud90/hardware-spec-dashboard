"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { getMetricHighlight, getRelativeDelta } from "@/lib/hardware-math";
import { formatSignedPercent } from "@/lib/format";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { SERIES_COLORS, cn } from "@/lib/utils";

/**
 * Per-metric bar comparison with explicit win/loss marking.
 *
 * Bars are drawn from a zero baseline so length is proportional to value, and
 * every bar carries its formatted value as a direct label — the numbers are
 * never inferred from bar length alone.
 *
 * Polarity is surfaced twice over: the row header states the direction, and
 * winners and losers are marked with an arrow glyph plus a text label in
 * addition to the status colour, so the distinction survives colour-blindness,
 * greyscale printing and forced-colours mode.
 */
export function MetricBars({
  components,
  metrics,
  baselineId,
  title = "Metric-by-metric comparison",
}: {
  components: ResolvedComponent[];
  metrics: ResolvedMetric[];
  /** Component all deltas are measured against; defaults to the first column. */
  baselineId?: string;
  title?: string;
}) {
  const baseline = baselineId
    ? components.find((component) => component.id === baselineId) ?? components[0]
    : components[0];

  const rows = React.useMemo(
    () =>
      metrics
        .map((metric) => {
          const values = components.map((component) => numericValue(component, metric.key));
          const present = values.filter((value): value is number => value !== null);
          if (present.length < 2) return null;
          const max = Math.max(...present, 0);
          return {
            metric,
            values,
            max,
            highlights: getMetricHighlight(metric.key, values),
            baselineValue: numericValue(baseline, metric.key),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    [components, metrics, baseline],
  );

  const colorOf = (index: number) => SERIES_COLORS[index % SERIES_COLORS.length];

  return (
    <ChartFrame
      title={title}
      description={`Bar length is proportional to the raw value. Percentages are measured against ${baseline.name} and are oriented so a positive figure always means better.`}
      note="A metric where fewer than two components have a value is omitted, and an exact tie is marked neutral rather than awarded to whichever column happens to come first."
      legend={components.map((component, index) => (
        <LegendItem key={component.id} color={colorOf(index)} label={component.name} />
      ))}
      table={{
        columns: [
          { key: "metric", label: "Metric" },
          { key: "direction", label: "Better" },
          ...components.map((component) => ({
            key: component.id,
            label: component.name,
            numeric: true,
          })),
        ],
        rows: rows.map((row) => {
          const record: Record<string, string> = {
            metric: row.metric.label,
            direction: row.metric.polarity === "LOWER_BETTER" ? "Lower" : "Higher",
          };
          components.forEach((component, index) => {
            record[component.id] = formatMetricValue(row.metric, row.values[index]);
          });
          return record;
        }),
      }}
    >
      <div className="space-y-5">
        {rows.map((row) => (
          <section key={row.metric.key} className="space-y-2">
            <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h4 className="text-xs font-medium text-ink">{row.metric.label}</h4>
              <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                {row.metric.polarity === "LOWER_BETTER" ? "lower is better" : "higher is better"}
              </span>
            </header>

            <ul className="space-y-1">
              {components.map((component, index) => {
                const value = row.values[index];
                const highlight = row.highlights[index];
                const width =
                  value !== null && row.max > 0
                    ? Math.max(1.5, (value / row.max) * 100)
                    : 0;
                const delta =
                  component.id === baseline.id
                    ? null
                    : getRelativeDelta(row.metric.key, value, row.baselineValue);

                return (
                  <li key={component.id} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 truncate text-[11px] text-ink-muted sm:w-44">
                      {component.name}
                    </span>

                    {/* 2px gap between the track and the fill keeps adjacent
                        bars visually separated without a border. */}
                    <span className="relative h-4 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-surface-2">
                      <span
                        className="absolute inset-y-0 left-0 rounded-[4px] transition-[width]"
                        style={{ width: `${width}%`, backgroundColor: colorOf(index) }}
                      />
                    </span>

                    <span className="tnum w-24 shrink-0 text-right text-[11px] text-ink">
                      {formatMetricValue(row.metric, value)}
                    </span>

                    <span
                      className={cn(
                        "tnum flex w-24 shrink-0 items-center justify-end gap-1 text-[11px]",
                        highlight === "winner" && "text-good",
                        highlight === "loser" && "text-critical",
                        highlight === "neutral" && "text-ink-muted",
                      )}
                    >
                      {component.id === baseline.id ? (
                        <span className="text-ink-muted">baseline</span>
                      ) : delta === null ? (
                        <Minus className="size-3" aria-hidden />
                      ) : (
                        <>
                          {delta > 0 ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : delta < 0 ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : (
                            <Minus className="size-3" aria-hidden />
                          )}
                          {formatSignedPercent(delta)}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </ChartFrame>
  );
}
