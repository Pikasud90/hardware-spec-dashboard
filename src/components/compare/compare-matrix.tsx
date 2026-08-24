"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, groupedMetricsFor, type ResolvedMetric } from "@/lib/metrics";
import { getMetricHighlight, getRelativeDelta, type Highlight } from "@/lib/hardware-math";
import { formatSignedPercent } from "@/lib/format";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/validations/component";

/**
 * The side-by-side specification matrix.
 *
 * Behaviours that matter:
 *  - Rows are the union of every metric defined for the category, so a
 *    component missing a field renders an em dash rather than shifting the
 *    grid or throwing (US3).
 *  - Winners and losers are decided by `getMetricHighlight`, which is polarity
 *    aware: the lowest TDP wins and the highest core count wins, from the same
 *    call (US1). An exact tie across all columns is neutral — nobody wins.
 *  - Colour never carries the verdict alone: a winner also gets a directional
 *    arrow and a "best"/"worst" label available to assistive technology.
 *  - The metric column is sticky, so on a phone the spec name stays put while
 *    the component columns scroll horizontally (US4).
 */

export type DiffMode = "all" | "differences";

export function CompareMatrix({
  category,
  components,
  baselineId,
  diffMode,
  renderColumnHeader,
}: {
  category: Category;
  components: ResolvedComponent[];
  baselineId?: string;
  diffMode: DiffMode;
  renderColumnHeader?: (component: ResolvedComponent, index: number) => React.ReactNode;
}) {
  const baseline = baselineId
    ? (components.find((component) => component.id === baselineId) ?? components[0])
    : components[0];

  const sections = React.useMemo(() => {
    return groupedMetricsFor(category)
      .map((section) => {
        const rows = section.metrics
          .map((metric) => {
            const values = components.map((component) => component.values[metric.key] ?? null);
            const numeric = components.map((component) => numericValue(component, metric.key));
            const highlights =
              metric.kind === "number"
                ? getMetricHighlight(metric.key, numeric)
                : components.map<Highlight>(() => "neutral");

            const rendered = values.map((value) => formatMetricValue(metric, value));
            const identical = new Set(rendered).size === 1;
            const allEmpty = rendered.every((value) => value === "—");

            return { metric, values, numeric, highlights, rendered, identical, allEmpty };
          })
          // A row where nobody has a value is noise in every mode.
          .filter((row) => !row.allEmpty)
          .filter((row) => diffMode === "all" || !row.identical);

        return { group: section.group, rows };
      })
      .filter((section) => section.rows.length > 0);
  }, [category, components, diffMode]);

  const gridColumns = `minmax(12rem, 1.3fr) repeat(${components.length}, minmax(9rem, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
      <div style={{ minWidth: 200 + components.length * 150 }}>
        {renderColumnHeader && (
          <div
            className="sticky top-14 z-30 grid gap-px border-b border-edge bg-surface-1"
            style={{ gridTemplateColumns: gridColumns }}
          >
            <div className="sticky left-0 z-10 bg-surface-1 px-3 py-3 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Specification
            </div>
            {components.map((component, index) => (
              <div key={component.id} className="px-3 py-3">
                {renderColumnHeader(component, index)}
              </div>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <section key={section.group}>
            <h3
              className="sticky left-0 border-y border-edge bg-surface-2/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary"
              style={{ width: "fit-content", minWidth: "100%" }}
            >
              {section.group}
            </h3>

            {section.rows.map((row) => (
              <div
                key={row.metric.key}
                className="grid gap-px border-b border-edge/50 last:border-0 hover:bg-surface-2/30"
                style={{ gridTemplateColumns: gridColumns }}
              >
                <div className="sticky left-0 z-10 flex items-center gap-1.5 bg-surface-1 px-3 py-2.5">
                  <Tooltip
                    content={
                      <span>
                        <span className="block">{row.metric.description}</span>
                        {row.metric.formula && (
                          <span className="mt-1 block font-mono text-[10px] text-accent-bright">
                            {row.metric.formula}
                          </span>
                        )}
                      </span>
                    }
                  >
                    <span className="cursor-help truncate text-xs text-ink-secondary">
                      {row.metric.label}
                    </span>
                  </Tooltip>
                  {row.metric.derived && (
                    <span
                      title="Derived value"
                      className="shrink-0 rounded bg-accent/12 px-1 text-[9px] font-medium text-accent-bright"
                    >
                      fx
                    </span>
                  )}
                  {row.metric.kind === "number" && (
                    <span
                      className="shrink-0 text-[10px] text-ink-muted"
                      title={
                        row.metric.polarity === "LOWER_BETTER"
                          ? "Lower is better"
                          : row.metric.polarity === "HIGHER_BETTER"
                            ? "Higher is better"
                            : "No inherent direction"
                      }
                    >
                      {row.metric.polarity === "LOWER_BETTER"
                        ? "↓"
                        : row.metric.polarity === "HIGHER_BETTER"
                          ? "↑"
                          : ""}
                    </span>
                  )}
                </div>

                {components.map((component, index) => {
                  const highlight = row.highlights[index];
                  const delta =
                    component.id === baseline.id || row.metric.kind !== "number"
                      ? null
                      : getRelativeDelta(
                          row.metric.key,
                          row.numeric[index],
                          numericValue(baseline, row.metric.key),
                        );

                  return (
                    <div
                      key={component.id}
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2.5 text-xs",
                        highlight === "winner" && "bg-good/10",
                        highlight === "loser" && "bg-critical/8",
                      )}
                    >
                      <span
                        className={cn(
                          "truncate",
                          row.metric.kind === "number" && "tnum",
                          highlight === "winner"
                            ? "font-semibold text-good"
                            : highlight === "loser"
                              ? "text-critical"
                              : "text-ink",
                          row.rendered[index] === "—" && "text-ink-muted",
                        )}
                      >
                        {row.rendered[index]}
                        {highlight !== "neutral" && (
                          <span className="sr-only">
                            {highlight === "winner" ? " — best in this comparison" : " — worst in this comparison"}
                          </span>
                        )}
                      </span>

                      {delta !== null && (
                        <span
                          className={cn(
                            "tnum flex shrink-0 items-center gap-0.5 text-[10px]",
                            delta > 0.05
                              ? "text-good"
                              : delta < -0.05
                                ? "text-critical"
                                : "text-ink-muted",
                          )}
                          title={`Relative to ${baseline.name}`}
                        >
                          {delta > 0.05 ? (
                            <ArrowUp className="size-2.5" aria-hidden />
                          ) : delta < -0.05 ? (
                            <ArrowDown className="size-2.5" aria-hidden />
                          ) : (
                            <Minus className="size-2.5" aria-hidden />
                          )}
                          {formatSignedPercent(delta, 0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export type { ResolvedMetric };
