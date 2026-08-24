"use client";

import * as React from "react";
import {
  ArrowRight, CircleAlert, Info, Lightbulb, PiggyBank, TrendingUp, TriangleAlert, Zap,
} from "lucide-react";
import type { ResolvedComponent } from "@/lib/catalog";
import { COMPONENTS_BY_CATEGORY } from "@/lib/catalog";
import {
  SLOT_LABELS, auditBuild, buildTotal, estimatePower, generateInsights,
  type BuildSelection, type BuildSlot, type IssueLevel,
} from "@/lib/compatibility";
import { splitGst } from "@/lib/pricing";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The verdict panel: what this build costs, what it draws, what is wrong with
 * it, and what to do about it.
 *
 * Ordered by consequence — blockers first, because a build that will not POST
 * makes every other consideration irrelevant.
 */

const LEVEL_STYLE: Record<IssueLevel, { icon: typeof TriangleAlert; className: string; label: string }> = {
  blocker: { icon: CircleAlert, className: "border-critical/45 bg-critical/10 text-critical", label: "Blocker" },
  warning: { icon: TriangleAlert, className: "border-warning/45 bg-warning/10 text-warning", label: "Warning" },
  info: { icon: Info, className: "border-edge-strong bg-surface-2 text-ink-secondary", label: "Note" },
};

export function BuildSummary({
  build,
  onApply,
}: {
  build: BuildSelection;
  onApply: (slot: BuildSlot, component: ResolvedComponent) => void;
}) {
  const totals = React.useMemo(() => buildTotal(build), [build]);
  const power = React.useMemo(() => estimatePower(build), [build]);
  const issues = React.useMemo(() => auditBuild(build), [build]);
  const insights = React.useMemo(
    () => generateInsights(build, COMPONENTS_BY_CATEGORY),
    [build],
  );

  const gst = splitGst(totals.total);
  const blockers = issues.filter((i) => i.level === "blocker").length;

  return (
    <div className="space-y-4">
      {/* ---- cost ---- */}
      <section className="rounded-xl border border-edge bg-surface-1 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Build total
        </h2>
        <p className="tnum mt-1 text-3xl font-semibold tracking-tight text-ink">
          {totals.filled === 0 ? "—" : formatInr(totals.total)}
        </p>
        {totals.filled > 0 && (
          <dl className="mt-3 space-y-1 border-t border-edge pt-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Ex-GST</dt>
              <dd className="tnum text-ink-secondary">{formatInr(gst.base)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">GST at 18% (included)</dt>
              <dd className="tnum text-ink-secondary">{formatInr(gst.gst)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Parts costed</dt>
              <dd className="tnum text-ink-secondary">
                {totals.priced} of {totals.filled}
              </dd>
            </div>
          </dl>
        )}
        {totals.missingPrice.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-warning">
            No Indian price for {totals.missingPrice.map((s) => SLOT_LABELS[s].toLowerCase()).join(", ")} — not counted in the total.
          </p>
        )}
        <p className="mt-3 border-t border-edge pt-3 text-[11px] leading-relaxed text-ink-muted">
          Excludes cabinet, cooler, fans and peripherals, which this planner does not
          track. Prices are a researched snapshot, not a live feed — confirm with a
          retailer before ordering.
        </p>
      </section>

      {/* ---- power ---- */}
      {power.totalWatts > 0 && (
        <section className="rounded-xl border border-edge bg-surface-1 p-4">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Zap className="size-3.5 text-accent-bright" aria-hidden />
            Power
          </h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-2xl font-semibold text-ink">
              {Math.round(power.totalWatts)} W
            </span>
            <span className="text-xs text-ink-muted">estimated draw</span>
          </div>

          <div className="mt-3 space-y-1.5">
            {[
              { label: "Processor", value: power.cpuWatts, color: "var(--color-series-1)" },
              { label: "Graphics", value: power.gpuWatts, color: "var(--color-series-2)" },
              { label: "Everything else", value: power.otherWatts, color: "var(--color-series-3)" },
            ]
              .filter((row) => row.value > 0)
              .map((row) => (
                <div key={row.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 shrink-0 text-ink-muted">{row.label}</span>
                  <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-surface-2">
                    <span
                      className="block h-full rounded-[4px]"
                      style={{
                        width: `${(row.value / power.totalWatts) * 100}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </span>
                  <span className="tnum w-12 shrink-0 text-right text-ink-secondary">
                    {Math.round(row.value)} W
                  </span>
                </div>
              ))}
          </div>

          <p className="mt-3 border-t border-edge pt-2.5 text-[11px] leading-relaxed text-ink-muted">
            Recommended supply:{" "}
            <span className="font-medium text-ink">{power.recommendedPsuWatts} W</span>{" "}
            (1.4× headroom for graphics transients).
            {power.loadFraction !== null && (
              <>
                {" "}Your unit would run at{" "}
                <span
                  className={cn(
                    "font-medium",
                    power.loadFraction > 0.9
                      ? "text-critical"
                      : power.loadFraction < 0.3
                        ? "text-warning"
                        : "text-good",
                  )}
                >
                  {Math.round(power.loadFraction * 100)}% load
                </span>
                .
              </>
            )}
          </p>
        </section>
      )}

      {/* ---- issues ---- */}
      <section className="rounded-xl border border-edge bg-surface-1 p-4">
        <h2 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Compatibility
          {issues.length > 0 && (
            <Badge variant={blockers > 0 ? "critical" : "neutral"}>
              {issues.length} {issues.length === 1 ? "item" : "items"}
            </Badge>
          )}
        </h2>

        {issues.length === 0 ? (
          <p className="mt-2 text-xs text-good">
            {totals.filled === 0
              ? "Start with a processor — it constrains everything else."
              : "No problems found with the parts selected so far."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {issues.map((issue, index) => {
              const style = LEVEL_STYLE[issue.level];
              const Icon = style.icon;
              return (
                <li
                  key={index}
                  className={cn("rounded-lg border p-3 text-xs", style.className)}
                >
                  <p className="flex items-start gap-2 font-medium">
                    <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      <span className="sr-only">{style.label}: </span>
                      {issue.title}
                    </span>
                  </p>
                  <p className="mt-1 pl-5 leading-relaxed opacity-90">{issue.detail}</p>
                  {issue.fix && (
                    <p className="mt-1.5 pl-5 leading-relaxed text-ink-secondary">
                      <span className="font-medium">Fix: </span>
                      {issue.fix}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- insights ---- */}
      {insights.length > 0 && (
        <section className="rounded-xl border border-edge bg-surface-1 p-4">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Lightbulb className="size-3.5 text-accent-bright" aria-hidden />
            Worth considering
          </h2>
          <ul className="mt-3 space-y-2">
            {insights.map((insight, index) => {
              const Icon =
                insight.kind === "saving"
                  ? PiggyBank
                  : insight.kind === "upgrade"
                    ? TrendingUp
                    : Info;
              return (
                <li key={index} className="rounded-lg border border-edge bg-surface-2/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-start gap-2 text-xs font-medium text-ink">
                      <Icon
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          insight.kind === "saving" ? "text-good" : "text-accent-bright",
                        )}
                        aria-hidden
                      />
                      {insight.title}
                    </p>
                    {insight.deltaInr !== null && insight.deltaInr !== 0 && (
                      <span
                        className={cn(
                          "tnum shrink-0 text-xs font-medium",
                          insight.deltaInr < 0 ? "text-good" : "text-ink-secondary",
                        )}
                      >
                        {insight.deltaInr < 0 ? "−" : "+"}
                        {formatInr(Math.abs(insight.deltaInr))}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 pl-5 text-[11px] leading-relaxed text-ink-muted">
                    {insight.detail}
                  </p>
                  {insight.priceUncertain && (
                    <p className="mt-1.5 flex gap-1.5 pl-5 text-[11px] leading-relaxed text-warning">
                      <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                      <span>
                        The rupee figure here rests on a price marked volatile, so treat the
                        saving as indicative. Check both parts at a retailer before acting on
                        it.
                      </span>
                    </p>
                  )}
                  {insight.suggestion && (
                    <div className="mt-2 pl-5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApply(insight.slot, insight.suggestion as ResolvedComponent)}
                      >
                        Swap in {insight.suggestion.name}
                        <ArrowRight aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
