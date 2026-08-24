"use client";

import * as React from "react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { fiveNumberSummary, histogram, percentileRank } from "@/lib/stats";
import { Tooltip } from "@/components/ui/tooltip";
import { formatTrimmed } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Where one component sits within its category's distribution for one metric.
 *
 * A raw number ("128 MB of L3") says nothing about whether that is remarkable.
 * The histogram gives the population, the marker gives the position, and the
 * percentile — computed polarity-aware, so 95th means "better than 95% of the
 * category" even for a lower-is-better metric — gives the verdict.
 */
export function DistributionStrip({
  component,
  peers,
  metric,
  bins = 14,
}: {
  component: ResolvedComponent;
  peers: ResolvedComponent[];
  metric: ResolvedMetric;
  bins?: number;
}) {
  const { value, percentile, summary, histogramBins } = React.useMemo(() => {
    const population = peers.map((peer) => numericValue(peer, metric.key));
    const own = numericValue(component, metric.key);
    return {
      value: own,
      percentile: percentileRank(own, population, metric.polarity),
      summary: fiveNumberSummary(population),
      histogramBins: histogram(population, bins),
    };
  }, [component, peers, metric, bins]);

  if (value === null || summary === null || histogramBins.length === 0) return null;

  const maxCount = Math.max(...histogramBins.map((bin) => bin.count), 1);
  const span = summary.max - summary.min;
  const positionPct = span > 0 ? ((value - summary.min) / span) * 100 : 50;

  const tier =
    percentile === null
      ? "neutral"
      : percentile >= 80
        ? "good"
        : percentile <= 20
          ? "critical"
          : "neutral";

  return (
    <div className="space-y-2 rounded-lg border border-edge bg-surface-2/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Tooltip content={metric.description}>
          <span className="cursor-help text-xs font-medium text-ink">{metric.label}</span>
        </Tooltip>
        <span className="tnum text-xs text-ink-secondary">
          {formatMetricValue(metric, value)}
        </span>
      </div>

      <div className="relative h-12">
        {/* Histogram of the category population */}
        <div className="absolute inset-x-0 bottom-0 flex h-10 items-end gap-px">
          {histogramBins.map((bin, index) => (
            <Tooltip
              key={index}
              content={`${bin.count} component${bin.count === 1 ? "" : "s"} between ${formatTrimmed(bin.x0, 1)} and ${formatTrimmed(bin.x1, 1)}`}
            >
              <div
                className="min-h-[2px] flex-1 rounded-t-[2px] bg-surface-3 transition-colors hover:bg-edge-strong"
                style={{ height: `${(bin.count / maxCount) * 100}%` }}
              />
            </Tooltip>
          ))}
        </div>

        {/* This component's position */}
        <div
          className="absolute bottom-0 top-0 w-px"
          style={{ left: `${Math.min(99.5, Math.max(0.5, positionPct))}%` }}
        >
          <div
            className={cn(
              "h-full w-px",
              tier === "good"
                ? "bg-good"
                : tier === "critical"
                  ? "bg-critical"
                  : "bg-accent-strong",
            )}
          />
          <div
            className={cn(
              "absolute -left-1 -top-0.5 size-2 rotate-45",
              tier === "good"
                ? "bg-good"
                : tier === "critical"
                  ? "bg-critical"
                  : "bg-accent-strong",
            )}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-ink-muted">
        <span className="tnum">{formatMetricValue(metric, summary.min)}</span>
        <span
          className={cn(
            "tnum font-medium",
            tier === "good" ? "text-good" : tier === "critical" ? "text-critical" : "text-ink-secondary",
          )}
        >
          {percentile === null
            ? "—"
            : `${Math.round(percentile)}th percentile of ${summary.count}`}
        </span>
        <span className="tnum">{formatMetricValue(metric, summary.max)}</span>
      </div>
    </div>
  );
}
