"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Plus, GitCompareArrows } from "lucide-react";
import {
  COMPONENTS_BY_CATEGORY, numericValue, type ResolvedComponent,
} from "@/lib/catalog";
import {
  analyticMetricsFor, formatMetricValue, groupedMetricsFor, metricFor,
} from "@/lib/metrics";
import { DistributionStrip } from "@/components/charts/distribution-strip";
import { Gauge } from "@/components/charts/gauge";
import { useCompare } from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { PriceConfidenceBadge } from "@/components/ui/price-badge";
import { formatInr, formatIsoDate, formatUsd } from "@/lib/format";
import { CATEGORY_LABELS, type Category } from "@/lib/validations/component";
import { clean } from "@/lib/stats";
import { cn } from "@/lib/utils";

/**
 * Single-component specification sheet.
 *
 * Beyond listing the spec sheet, this view answers "is that number good?" —
 * every headline metric is placed within its category's distribution, with a
 * polarity-aware percentile, because 96 MB of L3 means nothing until you know
 * what the rest of the category ships.
 */

/** The derived quantities worth promoting to gauges, per category. */
const HERO_METRICS: Record<Category, string[]> = {
  cpu: ["gamingIndex", "multiThreadIndex", "singleThreadIndex", "perfPerWatt"],
  gpu: ["rasterIndex", "theoreticalTflops", "memoryBandwidthGbs", "perfPerWatt"],
  ram: ["trueLatencyNs", "memoryBandwidthDualGbs", "ramEfficiencyScore", "costPerGb"],
  storage: ["seqReadMb", "interfaceUtilisationPct", "dwpd", "costPerTb"],
  motherboard: ["expansionScore", "vrmTotalCurrentA", "m2Slots", "maxMemorySpeedMts"],
};

export function ComponentDetail({ component }: { component: ResolvedComponent }) {
  const { isSelected, toggle, hasCapacity, category: trayCategory, ids } = useCompare();
  const peers = COMPONENTS_BY_CATEGORY[component.category];
  const selected = isSelected(component.id);
  const blocked = !selected && !hasCapacity && trayCategory === component.category;

  const heroMetrics = React.useMemo(
    () =>
      HERO_METRICS[component.category]
        .map((key) => metricFor(component.category, key))
        .filter((metric): metric is NonNullable<typeof metric> => metric !== undefined),
    [component.category],
  );

  const distributionMetrics = React.useMemo(
    () => analyticMetricsFor(component.category).filter((metric) => metric.headline).slice(0, 8),
    [component.category],
  );

  const sections = React.useMemo(
    () => groupedMetricsFor(component.category),
    [component.category],
  );

  /** Nearest peers by MSRP — the realistic alternatives at this price. */
  const alternatives = React.useMemo(() => {
    if (component.inrPrice === null) {
      return peers.filter((p) => p.id !== component.id).slice(0, 4);
    }
    const own = component.inrPrice;
    return peers
      .filter((peer) => peer.id !== component.id && peer.inrPrice !== null)
      .sort(
        (a, b) =>
          Math.abs((a.inrPrice as number) - own) -
          Math.abs((b.inrPrice as number) - own),
      )
      .slice(0, 4);
  }, [peers, component]);

  const compareHref = `/compare/?category=${component.category}&ids=${[
    component.id,
    ...ids.filter((id) => id !== component.id),
  ]
    .slice(0, 4)
    .join(",")}`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={`/?category=${component.category}`}
              className="text-ink-muted transition-colors hover:text-accent-bright"
            >
              {CATEGORY_LABELS[component.category]}
            </Link>
            <span className="text-ink-muted">/</span>
            <span className="text-ink-secondary">{component.brand}</span>
            <Badge variant="outline">{component.series}</Badge>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {component.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="tnum text-lg font-semibold text-ink">
                  {formatInr(component.inrPrice)}
                </span>
                <PriceConfidenceBadge component={component} />
                {component.msrp !== null && (
                  <span className="text-xs text-ink-muted">
                    {formatUsd(component.msrp)} at launch
                  </span>
                )}
                <span className="text-xs text-ink-muted">
                  Released {formatIsoDate(component.releaseDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selected ? "secondary" : "primary"}
                size="sm"
                onClick={() => toggle(component)}
                disabled={blocked}
              >
                {selected ? <Check aria-hidden /> : <Plus aria-hidden />}
                {selected ? "In comparison" : "Add to comparison"}
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={compareHref}>
                  <GitCompareArrows aria-hidden />
                  Open comparison
                </Link>
              </Button>
            </div>
          </div>

          {component.summary && (
            <p className="max-w-3xl border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-ink-secondary">
              {component.summary}
            </p>
          )}
        </header>

        {/* Derived headline figures */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            Derived figures
            <span className="ml-2 text-xs font-normal text-ink-muted">
              scaled against the {peers.length} {CATEGORY_LABELS[component.category].toLowerCase()} in this catalogue
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroMetrics.map((metric) => {
              const population = clean(peers.map((peer) => numericValue(peer, metric.key)));
              if (population.length === 0) return null;
              return (
                <Gauge
                  key={metric.key}
                  metric={metric}
                  value={numericValue(component, metric.key)}
                  min={Math.min(...population)}
                  max={Math.max(...population)}
                />
              );
            })}
          </div>
        </section>

        {/* Placement within the category */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            Position within {CATEGORY_LABELS[component.category].toLowerCase()}
          </h2>
          <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
            Each strip is the distribution of that specification across the whole category;
            the marker is this component. Percentiles are polarity-aware, so a high
            percentile always means better.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {distributionMetrics.map((metric) => (
              <DistributionStrip
                key={metric.key}
                component={component}
                peers={peers}
                metric={metric}
              />
            ))}
          </div>
        </section>

        {/* Full specification sheet */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            Full specification
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.group}
                className="overflow-hidden rounded-xl border border-edge bg-surface-1"
              >
                <h3 className="border-b border-edge bg-surface-2/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                  {section.group}
                </h3>
                <dl className="divide-y divide-edge/50">
                  {section.metrics.map((metric) => {
                    const rendered = formatMetricValue(metric, component.values[metric.key]);
                    return (
                      <div
                        key={metric.key}
                        className="flex items-baseline justify-between gap-3 px-4 py-2"
                      >
                        <Tooltip
                          content={
                            <span>
                              <span className="block">{metric.description}</span>
                              {metric.formula && (
                                <span className="mt-1 block font-mono text-[10px] text-accent-bright">
                                  {metric.formula}
                                </span>
                              )}
                            </span>
                          }
                        >
                          <dt className="flex cursor-help items-center gap-1.5 text-xs text-ink-muted">
                            {metric.label}
                            {metric.derived && (
                              <span className="rounded bg-accent/12 px-1 text-[9px] font-medium text-accent-bright">
                                fx
                              </span>
                            )}
                          </dt>
                        </Tooltip>
                        <dd
                          className={cn(
                            "text-right text-xs",
                            metric.kind === "number" && "tnum",
                            rendered === "—" ? "text-ink-muted" : "text-ink",
                          )}
                        >
                          {rendered}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Nearest alternatives */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            Closest alternatives by price
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {alternatives.map((peer) => (
              <Link
                key={peer.id}
                href={`/component/${peer.slug}/`}
                className="group rounded-xl border border-edge bg-surface-1 p-4 transition-colors hover:border-accent/50"
              >
                <p className="text-xs font-medium text-ink group-hover:text-accent-bright">
                  {peer.name}
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">{peer.brand}</p>
                <p className="tnum mt-2 text-sm text-ink-secondary">
                  {formatInr(peer.inrPrice)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
