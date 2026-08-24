"use client";

import * as React from "react";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { Filter, RotateCcw, Search, TriangleAlert, X } from "lucide-react";
import {
  COMPONENTS_BY_CATEGORY,
  brandsIn,
  groupValuesFor,
  groupingsFor,
} from "@/lib/catalog";
import { SEARCH_INDEX } from "@/lib/catalog";
import { search } from "@/lib/search";
import { ComponentTable } from "@/components/catalog/component-table";
import { CategoryPrimer } from "@/components/catalog/category-primer";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/validations/component";
import { cn, plural } from "@/lib/utils";
import { VOLATILE_CATEGORY_NOTES } from "@/lib/pricing";

/**
 * Catalogue browser.
 *
 * All filter state lives in the URL via `nuqs`, so any view is a shareable
 * link. Parsers are constrained (`parseAsStringLiteral` over the known
 * categories, membership checks on brands and groups), which means a
 * hand-edited or stale URL degrades to a valid view instead of rendering an
 * error — the sanitisation path for US5.
 */
export function CatalogView() {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORIES).withDefault("cpu"),
  );
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [brands, setBrands] = useQueryState(
    "brand",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [groups, setGroups] = useQueryState(
    "group",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const groupings = React.useMemo(() => groupingsFor(category), [category]);
  const availableBrands = React.useMemo(() => brandsIn(category), [category]);
  /** Every selectable value across all grouping axes, for URL validation. */
  const groupOptions = React.useMemo(
    () =>
      groupings.map((grouping) => ({
        ...grouping,
        values: groupValuesFor(category, grouping.key),
      })),
    [groupings, category],
  );
  const availableGroups = React.useMemo(
    () => groupOptions.flatMap((entry) => entry.values),
    [groupOptions],
  );

  // Any brand or group value that does not exist in this category is dropped
  // rather than silently filtering everything out (US5).
  const activeBrands = React.useMemo(
    () => brands.filter((brand) => availableBrands.includes(brand)),
    [brands, availableBrands],
  );
  const activeGroups = React.useMemo(
    () => groups.filter((group) => availableGroups.includes(group)),
    [groups, availableGroups],
  );
  const droppedFilters =
    brands.length - activeBrands.length + (groups.length - activeGroups.length);

  const rows = React.useMemo(() => {
    let candidates = COMPONENTS_BY_CATEGORY[category];

    if (query.trim().length > 0) {
      const allowedIds = new Set(candidates.map((component) => component.id));
      const ranked = search(SEARCH_INDEX, query, { limit: 500, allowedIds, threshold: 0.15 });
      const order = new Map(ranked.map((hit, index) => [hit.id, index]));
      candidates = candidates
        .filter((component) => order.has(component.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    if (activeBrands.length > 0) {
      candidates = candidates.filter((component) => activeBrands.includes(component.brand));
    }
    // Selections within one axis are OR'd; across axes they are AND'd, which
    // is what "AM5 processors in the Ryzen 7 tier" naturally means.
    for (const entry of groupOptions) {
      const selected = activeGroups.filter((value) => entry.values.includes(value));
      if (selected.length === 0) continue;
      candidates = candidates.filter((component) =>
        selected.includes(String(component.values[entry.key] ?? "")),
      );
    }
    return candidates;
  }, [category, query, activeBrands, activeGroups, groupOptions]);

  const filtersActive =
    query.trim().length > 0 || activeBrands.length > 0 || activeGroups.length > 0;

  const resetFilters = React.useCallback(() => {
    void setQuery(null);
    void setBrands(null);
    void setGroups(null);
  }, [setQuery, setBrands, setGroups]);

  const changeCategory = React.useCallback(
    (next: Category) => {
      // Filters are category-scoped; carrying them across would be meaningless.
      void setCategory(next);
      void setBrands(null);
      void setGroups(null);
    },
    [setCategory, setBrands, setGroups],
  );

  const toggleIn = React.useCallback(
    (
      value: string,
      current: string[],
      setter: (next: string[] | null) => void,
    ) => {
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      setter(next.length > 0 ? next : null);
    },
    [],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* Category tabs */}
        <div
          role="tablist"
          aria-label="Component category"
          className="flex gap-1 overflow-x-auto rounded-lg border border-edge bg-surface-1 p-1"
        >
          {CATEGORIES.map((entry) => {
            const active = entry === category;
            return (
              <button
                key={entry}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => changeCategory(entry)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/15 text-accent-strong"
                    : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
                )}
              >
                <CategoryIcon category={entry} />
                {CATEGORY_LABELS[entry]}
                <span
                  className={cn(
                    "tnum rounded px-1.5 py-0.5 text-[10px]",
                    active ? "bg-accent/20" : "bg-surface-2 text-ink-muted",
                  )}
                >
                  {COMPONENTS_BY_CATEGORY[entry].length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter row — kept on one line above the grid */}
        <div className="space-y-3 rounded-xl border border-edge bg-surface-1 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => void setQuery(event.target.value || null)}
                placeholder={`Filter ${CATEGORY_LABELS[category].toLowerCase()}…`}
                aria-label={`Filter ${CATEGORY_LABELS[category]}`}
                className="h-9 w-full rounded-md border border-edge bg-surface-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="tnum text-xs text-ink-muted">
                {rows.length} {plural(rows.length, "result")}
              </span>
              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw aria-hidden />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <FilterChips
              label="Brand"
              options={availableBrands}
              selected={activeBrands}
              onToggle={(value) => toggleIn(value, activeBrands, (next) => void setBrands(next))}
            />
            {groupOptions.map((entry) =>
              entry.values.length > 1 ? (
                <FilterChips
                  key={entry.key}
                  label={entry.label}
                  options={entry.values}
                  selected={activeGroups}
                  onToggle={(value) =>
                    toggleIn(value, activeGroups, (next) => void setGroups(next))
                  }
                />
              ) : null,
            )}
          </div>

          {droppedFilters > 0 && (
            <p className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <Filter className="size-3.5 shrink-0" aria-hidden />
              {droppedFilters} filter {plural(droppedFilters, "value")} from the URL{" "}
              {droppedFilters === 1 ? "does" : "do"} not exist in{" "}
              {CATEGORY_LABELS[category]} and {droppedFilters === 1 ? "was" : "were"}{" "}
              ignored.
            </p>
          )}
        </div>

        <CategoryPrimer category={category} />

        {VOLATILE_CATEGORY_NOTES[category] && (
          <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs leading-relaxed text-warning">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Prices here are unusually volatile. </span>
              {VOLATILE_CATEGORY_NOTES[category]}
            </span>
          </p>
        )}

        {rows.length === 0 ? (
          <EmptyState
            title="No components match these filters"
            description={
              query.trim().length > 0
                ? `Nothing in ${CATEGORY_LABELS[category]} matches “${query}” with the current filters applied.`
                : `The selected filters have no overlap in ${CATEGORY_LABELS[category]}.`
            }
            action={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                <RotateCcw aria-hidden />
                Reset all filters
              </Button>
            }
          />
        ) : (
          <ComponentTable category={category} rows={rows} />
        )}
      </div>
    </TooltipProvider>
  );
}

function FilterChips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-accent bg-accent/15 text-accent-strong"
                  : "border-edge bg-surface-2 text-ink-secondary hover:border-edge-strong hover:text-ink",
              )}
            >
              {option}
              {active && <X className="size-3" aria-hidden />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
