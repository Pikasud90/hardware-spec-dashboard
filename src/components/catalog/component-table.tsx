"use client";

import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Check, Plus } from "lucide-react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { headlineMetricsFor, formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { useCompare } from "@/components/compare/compare-provider";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/validations/component";

/**
 * The catalogue grid.
 *
 * Columns are generated from the metric registry, so a category's table always
 * shows that category's headline metrics without any per-category table code.
 *
 * Sorting comparators read the raw numeric value, never the formatted string —
 * "1.2 TB" and "980 GB" must order by 1200 and 980, not alphabetically (US8).
 * Missing values always sort last regardless of direction, because a blank is
 * not "smallest"; it is unknown (US3).
 */

function sortableHeader(metric: ResolvedMetric) {
  return metric.short;
}

export function ComponentTable({
  category,
  rows,
}: {
  category: Category;
  rows: ResolvedComponent[];
}) {
  const { isSelected, toggle, hasCapacity, category: trayCategory } = useCompare();
  const metrics = React.useMemo(() => headlineMetricsFor(category), [category]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<ResolvedComponent>[]>(() => {
    const selectColumn: ColumnDef<ResolvedComponent> = {
      id: "select",
      header: () => <span className="sr-only">Add to comparison</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const component = row.original;
        const selected = isSelected(component.id);
        const blocked =
          !selected && !hasCapacity && trayCategory === component.category;
        return (
          <Tooltip
            content={
              blocked
                ? "The comparison tray is full — remove a component first."
                : selected
                  ? "Remove from comparison"
                  : "Add to comparison"
            }
          >
            <button
              type="button"
              onClick={() => toggle(component)}
              disabled={blocked}
              aria-pressed={selected}
              aria-label={`${selected ? "Remove" : "Add"} ${component.name} ${selected ? "from" : "to"} comparison`}
              className={cn(
                "grid size-6 place-items-center rounded border transition-colors",
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-edge-strong text-ink-muted hover:border-accent hover:text-accent-bright",
                blocked && "cursor-not-allowed opacity-35 hover:border-edge-strong",
              )}
            >
              {selected ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Plus className="size-3.5" aria-hidden />
              )}
            </button>
          </Tooltip>
        );
      },
    };

    const nameColumn: ColumnDef<ResolvedComponent> = {
      id: "name",
      accessorFn: (row) => row.name,
      header: "Component",
      cell: ({ row }) => (
        <Link
          href={`/component/${row.original.slug}/`}
          className="block min-w-0 font-medium text-ink transition-colors hover:text-accent-bright"
        >
          <span className="block truncate">{row.original.name}</span>
          <span className="block truncate text-[11px] font-normal text-ink-muted">
            {row.original.series}
          </span>
        </Link>
      ),
      sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    };

    const metricColumns: ColumnDef<ResolvedComponent>[] = metrics.map((metric) => ({
      id: metric.key,
      accessorFn: (row) => row.values[metric.key],
      header: () => (
        <Tooltip content={metric.description}>
          <span className="cursor-help border-b border-dotted border-edge-strong">
            {sortableHeader(metric)}
          </span>
        </Tooltip>
      ),
      cell: ({ row }) => (
        <span className={cn(metric.kind === "number" && "tnum")}>
          {formatMetricValue(metric, row.original.values[metric.key])}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        if (metric.kind === "number") {
          const a = numericValue(rowA.original, metric.key);
          const b = numericValue(rowB.original, metric.key);
          // Unknown values sink to the bottom in either direction.
          if (a === null && b === null) return 0;
          if (a === null) return 1;
          if (b === null) return -1;
          return a - b;
        }
        const a = String(rowA.original.values[metric.key] ?? "");
        const b = String(rowB.original.values[metric.key] ?? "");
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b);
      },
      meta: { numeric: metric.kind === "number" },
    }));

    return [selectColumn, nameColumn, ...metricColumns];
  }, [metrics, isSelected, toggle, hasCapacity, trayCategory]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Unknown values are handled explicitly by each comparator above.
    sortDescFirst: true,
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <caption className="sr-only">
          {rows.length} components, sortable by any column.
        </caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-edge">
              {headerGroup.headers.map((header, index) => {
                const canSort = header.column.getCanSort();
                const direction = header.column.getIsSorted();
                const numeric =
                  (header.column.columnDef.meta as { numeric?: boolean } | undefined)
                    ?.numeric ?? false;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : canSort
                            ? "none"
                            : undefined
                    }
                    className={cn(
                      "whitespace-nowrap bg-surface-1 px-3 py-2.5 text-xs font-medium text-ink-secondary",
                      numeric ? "text-right" : "text-left",
                      // Keep identity visible while scrolling wide spec tables (US4).
                      index === 0 && "sticky left-0 z-20 w-10",
                      index === 1 && "sticky left-10 z-20 min-w-56",
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1.5 transition-colors hover:text-ink",
                          direction && "text-ink",
                          numeric && "flex-row-reverse",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {direction === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : direction === "desc" ? (
                          <ArrowDown className="size-3" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const selected = isSelected(row.original.id);
            return (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-edge/60 transition-colors last:border-0",
                  selected ? "bg-accent/8" : "hover:bg-surface-2/50",
                )}
              >
                {row.getVisibleCells().map((cell, index) => {
                  const numeric =
                    (cell.column.columnDef.meta as { numeric?: boolean } | undefined)
                      ?.numeric ?? false;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-3 py-2.5 text-ink-secondary",
                        numeric ? "text-right" : "text-left",
                        index === 0 &&
                          cn("sticky left-0 z-10", selected ? "bg-[#0d1526]" : "bg-surface-1"),
                        index === 1 &&
                          cn(
                            "sticky left-10 z-10 max-w-64",
                            selected ? "bg-[#0d1526]" : "bg-surface-1",
                          ),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
