"use client";

import * as React from "react";
import { Check, EyeOff, Search, TriangleAlert } from "lucide-react";
import { COMPONENTS_BY_CATEGORY, SEARCH_INDEX, type ResolvedComponent } from "@/lib/catalog";
import { search } from "@/lib/search";
import { headlineMetricsFor, formatMetricValue } from "@/lib/metrics";
import {
  SLOT_CATEGORY, SLOT_LABELS, filterCompatible, upstreamOf,
  type BuildSelection, type BuildSlot,
} from "@/lib/compatibility";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceConfidenceBadge } from "@/components/ui/price-badge";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Part picker for one build slot.
 *
 * The defining behaviour: by default it shows **only what will actually work**
 * with everything already chosen. Incompatible parts are not greyed out and
 * left to be puzzled over — they are gone, with a count and a toggle to
 * inspect them and the specific reason each was excluded.
 *
 * That reason matters. "47 parts hidden" is frustrating; "MSI Z790 Tomahawk —
 * LGA1700 board, your 9800X3D needs AM5" teaches the constraint.
 */

type SortKey = "price-asc" | "price-desc" | "performance";

const PERFORMANCE_KEY: Record<BuildSlot, string> = {
  cpu: "multiThreadIndex",
  gpu: "rasterIndex",
  ram: "ramEfficiencyScore",
  storage: "seqReadMb",
  motherboard: "expansionScore",
  psu: "wattage",
};

export function SlotPicker({
  slot,
  build,
  open,
  onOpenChange,
  onSelect,
}: {
  slot: BuildSlot;
  build: BuildSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (component: ResolvedComponent) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [showRejected, setShowRejected] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("price-asc");

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setShowRejected(false);
    }
  }, [open]);

  const category = SLOT_CATEGORY[slot];
  const metrics = React.useMemo(
    () => headlineMetricsFor(category).filter((m) => m.key !== "inrPrice").slice(0, 4),
    [category],
  );

  // Only the slots *upstream* of this one constrain the choice. Re-picking a
  // processor must not be limited by the board already selected — that board
  // will be re-validated (and dropped if it no longer fits) once the change
  // lands.
  const buildWithoutSlot = React.useMemo(() => upstreamOf(slot, build), [build, slot]);

  const { compatible, rejected } = React.useMemo(
    () => filterCompatible(COMPONENTS_BY_CATEGORY[category], slot, buildWithoutSlot),
    [category, slot, buildWithoutSlot],
  );

  const visible = React.useMemo(() => {
    let list = showRejected ? rejected.map((r) => r.component) : compatible;

    if (query.trim().length > 0) {
      const allowedIds = new Set(list.map((c) => c.id));
      const ranked = search(SEARCH_INDEX, query, { limit: 300, allowedIds, threshold: 0.15 });
      const order = new Map(ranked.map((hit, i) => [hit.id, i]));
      list = list.filter((c) => order.has(c.id)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      return list;
    }

    const perfKey = PERFORMANCE_KEY[slot];
    const num = (c: ResolvedComponent, k: string) =>
      typeof c.values[k] === "number" ? (c.values[k] as number) : null;

    return [...list].sort((a, b) => {
      if (sort === "performance") return (num(b, perfKey) ?? -1) - (num(a, perfKey) ?? -1);
      const pa = a.inrPrice ?? Infinity;
      const pb = b.inrPrice ?? Infinity;
      return sort === "price-asc" ? pa - pb : pb - pa;
    });
  }, [showRejected, rejected, compatible, query, sort, slot]);

  const reasonFor = React.useMemo(
    () => new Map(rejected.map((r) => [r.component.id, r.reason])),
    [rejected],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col p-0">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink">
            Choose a {SLOT_LABELS[slot].toLowerCase()}
          </DialogTitle>
          <p className="text-xs text-ink-muted">
            {showRejected ? (
              <>Showing the {rejected.length} parts that will <strong>not</strong> work with your current selection.</>
            ) : (
              <>
                {compatible.length} of {COMPONENTS_BY_CATEGORY[category].length} are compatible with
                what you have chosen so far.
              </>
            )}
          </p>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-2.5">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${SLOT_LABELS[slot].toLowerCase()}…`}
              aria-label={`Filter ${SLOT_LABELS[slot]}`}
              className="h-8 w-full rounded-md border border-edge bg-surface-2 pl-8 pr-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort order"
            className="h-8 rounded-md border border-edge bg-surface-2 px-2 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="performance">Performance</option>
          </select>

          {rejected.length > 0 && (
            <Button
              variant={showRejected ? "danger" : "outline"}
              size="sm"
              onClick={() => setShowRejected((v) => !v)}
            >
              <EyeOff aria-hidden />
              {showRejected ? "Show compatible" : `${rejected.length} incompatible`}
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {visible.length === 0 ? (
            <EmptyState
              title={query ? "Nothing matches that filter" : "No compatible parts"}
              description={
                query
                  ? "Try a shorter fragment — matching tolerates typos and missing spaces."
                  : "Your current selection rules out every part in this category. Change an earlier choice to open options back up."
              }
            />
          ) : (
            <ul className="space-y-1">
              {visible.map((component) => {
                const reason = reasonFor.get(component.id);
                const blocked = showRejected && reason !== undefined;
                return (
                  <li key={component.id}>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => {
                        onSelect(component);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                        blocked
                          ? "cursor-not-allowed opacity-70"
                          : "hover:border-accent/40 hover:bg-surface-2",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">
                            {component.name}
                          </span>
                          {component.availability !== "available" && (
                            <PriceConfidenceBadge component={component} />
                          )}
                        </div>
                        {blocked ? (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-critical">
                            <TriangleAlert className="size-3 shrink-0" aria-hidden />
                            {reason}
                          </p>
                        ) : (
                          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-ink-muted">
                            {metrics.map((metric) => (
                              <span key={metric.key}>
                                {metric.short}{" "}
                                <span className="tnum text-ink-secondary">
                                  {formatMetricValue(metric, component.values[metric.key])}
                                </span>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <span className="tnum shrink-0 text-sm font-semibold text-ink">
                        {formatInr(component.inrPrice)}
                      </span>
                      {!blocked && (
                        <Badge variant="accent" className="shrink-0">
                          <Check className="size-3" aria-hidden />
                          Pick
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
