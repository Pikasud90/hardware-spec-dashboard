"use client";

import * as React from "react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { COMPONENTS_BY_CATEGORY } from "@/lib/catalog";
import { analyticMetricsFor, metricFor } from "@/lib/metrics";
import { ParetoScatter } from "@/components/charts/pareto-scatter";
import { RankingBars } from "@/components/charts/ranking-bars";
import { ParallelCoordinates } from "@/components/charts/parallel-coordinates";
import { CorrelationMatrix } from "@/components/charts/correlation-matrix";
import { GenerationalTimeline } from "@/components/charts/generational-timeline";
import { MetricSelect } from "@/components/ui/metric-select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/validations/component";
import { cn } from "@/lib/utils";

/**
 * Category-level analysis.
 *
 * Where the comparison page answers "which of these four is better", this one
 * answers structural questions about a whole category: where the efficient
 * frontier sits, which specifications actually move together, how much of a
 * part's standing is explained by its release date, and which designs are
 * balanced versus specialised.
 */

/** Sensible entry points per category — the questions people actually open with. */
const DEFAULTS: Record<
  Category,
  { x: string; y: string; rank: string; trend: string }
> = {
  cpu: {
    x: "inrPrice",
    y: "multiThreadIndex",
    rank: "multiThreadIndex",
    trend: "multiThreadIndex",
  },
  gpu: { x: "inrPrice", y: "rasterIndex", rank: "rasterIndex", trend: "theoreticalTflops" },
  ram: {
    x: "inrPrice",
    y: "ramEfficiencyScore",
    rank: "trueLatencyNs",
    trend: "speedMts",
  },
  storage: { x: "costPerTb", y: "seqReadMb", rank: "seqReadMb", trend: "seqReadMb" },
  motherboard: {
    x: "inrPrice",
    y: "expansionScore",
    rank: "expansionScore",
    trend: "vrmTotalCurrentA",
  },
  psu: {
    x: "inrPrice",
    y: "wattage",
    rank: "costPerWatt",
    trend: "efficiencyPct",
  },
};

export function AnalyticsView() {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORIES).withDefault("cpu"),
  );
  const [xKey, setXKey] = useQueryState("x", parseAsString);
  const [yKey, setYKey] = useQueryState("y", parseAsString);
  const [rankKey, setRankKey] = useQueryState("rank", parseAsString);
  const [trendKey, setTrendKey] = useQueryState("trend", parseAsString);

  const components = COMPONENTS_BY_CATEGORY[category];
  const metrics = React.useMemo(() => analyticMetricsFor(category), [category]);
  const defaults = DEFAULTS[category];

  /** Fall back to the category default whenever a URL key is not valid here (US5). */
  const resolve = React.useCallback(
    (requested: string | null, fallback: string) => {
      const candidate = requested ? metricFor(category, requested) : undefined;
      if (candidate && candidate.analytic && candidate.kind === "number") return candidate;
      return metricFor(category, fallback) ?? metrics[0];
    },
    [category, metrics],
  );

  const xMetric = resolve(xKey, defaults.x);
  const yMetric = resolve(yKey, defaults.y);
  const rankMetric = resolve(rankKey, defaults.rank);
  const trendMetric = resolve(trendKey, defaults.trend);

  const changeCategory = React.useCallback(
    (next: Category) => {
      // Metric keys are category-specific; carrying them over would be invalid.
      void setCategory(next);
      void setXKey(null);
      void setYKey(null);
      void setRankKey(null);
      void setTrendKey(null);
    },
    [setCategory, setXKey, setYKey, setRankKey, setTrendKey],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <div
          role="tablist"
          aria-label="Category"
          className="flex gap-1 overflow-x-auto rounded-lg border border-edge bg-surface-1 p-1"
        >
          {CATEGORIES.map((entry) => (
            <button
              key={entry}
              role="tab"
              type="button"
              aria-selected={entry === category}
              onClick={() => changeCategory(entry)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                entry === category
                  ? "bg-accent/15 text-accent-bright"
                  : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
              )}
            >
              {CATEGORY_LABELS[entry]}
              <span className="tnum text-[10px] text-ink-muted">
                {COMPONENTS_BY_CATEGORY[entry].length}
              </span>
            </button>
          ))}
        </div>

        {/* Trade-off explorer */}
        <div className="space-y-3 rounded-xl border border-edge bg-surface-1 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricSelect
              label="Scatter — horizontal"
              metrics={metrics}
              value={xMetric.key}
              onChange={(next) => void setXKey(next === defaults.x ? null : next)}
            />
            <MetricSelect
              label="Scatter — vertical"
              metrics={metrics}
              value={yMetric.key}
              onChange={(next) => void setYKey(next === defaults.y ? null : next)}
            />
            <MetricSelect
              label="Ranking metric"
              metrics={metrics}
              value={rankMetric.key}
              onChange={(next) => void setRankKey(next === defaults.rank ? null : next)}
            />
            <MetricSelect
              label="Trend over time"
              metrics={metrics}
              value={trendMetric.key}
              onChange={(next) => void setTrendKey(next === defaults.trend ? null : next)}
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ParetoScatter
            components={components}
            xMetric={xMetric}
            yMetric={yMetric}
          />
          <RankingBars components={components} metric={rankMetric} limit={15} />
        </div>

        <ParallelCoordinates components={components} metrics={metrics} />

        <div className="grid gap-5 xl:grid-cols-2">
          <GenerationalTimeline components={components} metric={trendMetric} />
          <CorrelationMatrix components={components} metrics={metrics} />
        </div>
      </div>
    </TooltipProvider>
  );
}
