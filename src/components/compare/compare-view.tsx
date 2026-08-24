"use client";

import * as React from "react";
import Link from "next/link";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { ArrowLeftRight, Plus, Rows3, TriangleAlert, X } from "lucide-react";
import {
  COMPONENTS_BY_CATEGORY, COMPONENT_BY_ID, type ResolvedComponent,
} from "@/lib/catalog";
import { analyticMetricsFor } from "@/lib/metrics";
import { CompareMatrix, type DiffMode } from "@/components/compare/compare-matrix";
import { MetricBars } from "@/components/charts/metric-bars";
import { RadarCompare } from "@/components/charts/radar-compare";
import { SpecHeatmap } from "@/components/charts/spec-heatmap";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";
import { MAX_COMPARE_SLOTS, useCompare } from "@/components/compare/compare-provider";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/validations/component";
import { cn, SERIES_COLORS } from "@/lib/utils";

/**
 * The comparison workspace.
 *
 * Selection lives entirely in the URL, which makes any comparison a shareable
 * link. Because URLs get edited, truncated and bookmarked against a catalogue
 * that may since have changed, everything read from them is validated: ids
 * that no longer exist or belong to a different category are dropped, the user
 * is told what was dropped, and the URL is rewritten to the repaired state so
 * a reload does not resurrect the problem (US5).
 */
export function CompareView() {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORIES).withDefault("cpu"),
  );
  const [rawIds, setRawIds] = useQueryState(
    "ids",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [baseline, setBaseline] = useQueryState("baseline", parseAsString);
  const [diffMode, setDiffMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["all", "differences"] as const).withDefault("all"),
  );

  const { setSelection } = useCompare();
  const [swapSlot, setSwapSlot] = React.useState<number | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [repairNotice, setRepairNotice] = React.useState<string | null>(null);

  /** Validate the URL's ids against the catalogue and the declared category. */
  const { components, invalidCount } = React.useMemo(() => {
    const seen = new Set<string>();
    const valid: ResolvedComponent[] = [];
    let invalid = 0;

    for (const id of rawIds) {
      const component = COMPONENT_BY_ID.get(id);
      if (!component || component.category !== category || seen.has(id)) {
        invalid += 1;
        continue;
      }
      if (valid.length >= MAX_COMPARE_SLOTS) {
        invalid += 1;
        continue;
      }
      seen.add(id);
      valid.push(component);
    }
    return { components: valid, invalidCount: invalid };
  }, [rawIds, category]);

  // Rewrite the URL to the repaired selection, once, and say what happened.
  React.useEffect(() => {
    if (invalidCount === 0) return;
    setRepairNotice(
      `${invalidCount} component ${invalidCount === 1 ? "reference" : "references"} in the link ${invalidCount === 1 ? "was" : "were"} unrecognised, duplicated, or from another category, and ${invalidCount === 1 ? "has" : "have"} been removed.`,
    );
    void setRawIds(components.length > 0 ? components.map((component) => component.id) : null);
  }, [invalidCount, components, setRawIds]);

  // Keep the sticky tray in step with the URL so the two never disagree.
  React.useEffect(() => {
    if (components.length > 0) {
      setSelection(category, components.map((component) => component.id));
    }
  }, [category, components, setSelection]);

  const validBaseline =
    baseline && components.some((component) => component.id === baseline)
      ? baseline
      : (components[0]?.id ?? undefined);

  const analyticMetrics = React.useMemo(() => analyticMetricsFor(category), [category]);

  const updateIds = React.useCallback(
    (next: string[]) => {
      void setRawIds(next.length > 0 ? next : null);
    },
    [setRawIds],
  );

  const handleSwap = React.useCallback(
    (slotIndex: number, replacement: ResolvedComponent) => {
      const next = components.map((component) => component.id);
      next[slotIndex] = replacement.id;
      updateIds(next);
      setSwapSlot(null);
    },
    [components, updateIds],
  );

  const handleAdd = React.useCallback(
    (component: ResolvedComponent) => {
      updateIds([...components.map((entry) => entry.id), component.id]);
      setAddOpen(false);
    },
    [components, updateIds],
  );

  const handleRemove = React.useCallback(
    (id: string) => {
      updateIds(components.filter((component) => component.id !== id).map((c) => c.id));
    },
    [components, updateIds],
  );

  const selectedIds = components.map((component) => component.id);

  if (components.length < 2) {
    return (
      <div className="space-y-5">
        <CategoryPicker category={category} onChange={(next) => {
          void setCategory(next);
          void setRawIds(null);
        }} />
        <EmptyState
          icon={<Rows3 className="size-5" />}
          title={
            components.length === 0
              ? "Nothing selected to compare"
              : "Add one more component"
          }
          description={`Pick at least two ${CATEGORY_LABELS[category].toLowerCase()} to see a side-by-side matrix, a normalised profile and per-metric deltas.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden />
                Add a component
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/?category=${category}`}>Browse the catalogue</Link>
              </Button>
            </div>
          }
        />
        <GlobalSearch
          open={addOpen}
          onOpenChange={setAddOpen}
          category={category}
          excludeIds={selectedIds}
          onSelect={handleAdd}
          title="Add to comparison"
          description={`Only ${CATEGORY_LABELS[category].toLowerCase()} are shown — comparison is category-isolated.`}
        />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {repairNotice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="flex-1 leading-relaxed">
              <span className="font-medium">Link repaired. </span>
              {repairNotice}
            </p>
            <button
              type="button"
              onClick={() => setRepairNotice(null)}
              aria-label="Dismiss"
              className="rounded p-0.5 hover:bg-warning/20"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="accent">{CATEGORY_LABELS[category]}</Badge>
            <span className="text-xs text-ink-muted">
              {components.length} of {MAX_COMPARE_SLOTS} slots · deltas against{" "}
              <span className="text-ink-secondary">
                {components.find((c) => c.id === validBaseline)?.name}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Row visibility"
              className="flex rounded-md border border-edge bg-surface-1 p-0.5"
            >
              {(["all", "differences"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={diffMode === mode}
                  onClick={() => void setDiffMode(mode)}
                  className={cn(
                    "rounded px-2.5 py-1 text-[11px] transition-colors",
                    diffMode === mode
                      ? "bg-surface-3 text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {mode === "all" ? "All rows" : "Differences only"}
                </button>
              ))}
            </div>
            {components.length < MAX_COMPARE_SLOTS && (
              <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden />
                Add slot
              </Button>
            )}
          </div>
        </div>

        <CompareMatrix
          category={category}
          components={components}
          baselineId={validBaseline}
          diffMode={diffMode as DiffMode}
          renderColumnHeader={(component, index) => (
            <ColumnHeader
              component={component}
              index={index}
              isBaseline={component.id === validBaseline}
              onSwap={() => setSwapSlot(index)}
              onRemove={components.length > 2 ? () => handleRemove(component.id) : undefined}
              onMakeBaseline={() => void setBaseline(component.id)}
            />
          )}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <RadarCompare components={components} metrics={analyticMetrics} />
          <SpecHeatmap components={components} metrics={analyticMetrics} />
        </div>

        <MetricBars
          components={components}
          metrics={analyticMetrics}
          baselineId={validBaseline}
        />

        {/* Slot swap: scoped search that replaces one column in place (US9). */}
        <GlobalSearch
          open={swapSlot !== null}
          onOpenChange={(next) => {
            if (!next) setSwapSlot(null);
          }}
          category={category}
          excludeIds={selectedIds}
          onSelect={(component) => {
            if (swapSlot !== null) handleSwap(swapSlot, component);
          }}
          title="Replace this column"
          description={
            swapSlot !== null
              ? components.length === 2
                ? `Replacing ${components[swapSlot]?.name}. The other column stays exactly as it is.`
                : `Replacing ${components[swapSlot]?.name}. The other ${components.length - 1} columns stay exactly as they are.`
              : undefined
          }
        />

        <GlobalSearch
          open={addOpen}
          onOpenChange={setAddOpen}
          category={category}
          excludeIds={selectedIds}
          onSelect={handleAdd}
          title="Add to comparison"
          description={`Only ${CATEGORY_LABELS[category].toLowerCase()} are shown — comparison is category-isolated.`}
        />
      </div>
    </TooltipProvider>
  );
}

function ColumnHeader({
  component,
  index,
  isBaseline,
  onSwap,
  onRemove,
  onMakeBaseline,
}: {
  component: ResolvedComponent;
  index: number;
  isBaseline: boolean;
  onSwap: () => void;
  onRemove?: () => void;
  onMakeBaseline: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <span
          aria-hidden
          className="mt-1 size-2 shrink-0 rounded-[2px]"
          style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
        />
        <Link
          href={`/component/${component.slug}/`}
          className="min-w-0 flex-1 text-xs font-semibold leading-tight text-ink transition-colors hover:text-accent-bright"
        >
          {component.name}
        </Link>
      </div>
      <div className="flex items-center gap-1 pl-3.5">
        <span className="tnum text-[11px] text-ink-muted">
          {formatCurrency(component.msrp)}
        </span>
        {isBaseline ? (
          <Badge variant="outline" className="ml-auto">
            baseline
          </Badge>
        ) : (
          <button
            type="button"
            onClick={onMakeBaseline}
            className="ml-auto rounded px-1 text-[10px] text-ink-muted transition-colors hover:text-accent-bright"
          >
            set baseline
          </button>
        )}
      </div>
      <div className="flex gap-1 pl-3.5">
        <Tooltip content="Replace only this column">
          <Button variant="outline" size="icon-sm" onClick={onSwap} aria-label={`Replace ${component.name}`}>
            <ArrowLeftRight aria-hidden />
          </Button>
        </Tooltip>
        {onRemove && (
          <Tooltip content="Remove this column">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onRemove}
              aria-label={`Remove ${component.name}`}
            >
              <X aria-hidden />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function CategoryPicker({
  category,
  onChange,
}: {
  category: Category;
  onChange: (next: Category) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-edge bg-surface-1 p-1">
      {CATEGORIES.map((entry) => (
        <button
          key={entry}
          type="button"
          aria-pressed={entry === category}
          onClick={() => onChange(entry)}
          className={cn(
            "shrink-0 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            entry === category
              ? "bg-accent/15 text-accent-bright"
              : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
          )}
        >
          {CATEGORY_LABELS[entry]}
          <span className="tnum ml-1.5 text-[10px] text-ink-muted">
            {COMPONENTS_BY_CATEGORY[entry].length}
          </span>
        </button>
      ))}
    </div>
  );
}
