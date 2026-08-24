"use client";

import * as React from "react";
import { Table2, Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Shared shell for every chart.
 *
 * Enforces the parts that must never be optional: a title that names what is
 * plotted, a legend slot whenever more than one series is present, an escape
 * hatch to the underlying numbers as a table (so identity and value are never
 * carried by colour alone), and horizontal scrolling confined to the chart
 * rather than the page.
 */

export interface ChartTableColumn {
  key: string;
  label: string;
  numeric?: boolean;
}

export interface ChartFrameProps {
  title: string;
  description?: string;
  /** Short caveat rendered under the title, e.g. a modelling disclaimer. */
  note?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  /** Enables the "Data" toggle. Rows are rendered verbatim. */
  table?: {
    columns: ChartTableColumn[];
    rows: Array<Record<string, string | number | null>>;
  };
  /** Rendered instead of the chart when there is nothing to plot. */
  empty?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Minimum width before the chart body scrolls horizontally. */
  minWidth?: number;
}

export function ChartFrame({
  title,
  description,
  note,
  legend,
  children,
  table,
  empty,
  className,
  bodyClassName,
  minWidth,
}: ChartFrameProps) {
  const [showTable, setShowTable] = React.useState(false);

  return (
    <figure className={cn("rounded-xl border border-edge bg-surface-1", className)}>
      <figcaption className="flex flex-wrap items-start gap-3 border-b border-edge p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            {title}
            {note && (
              <Tooltip content={note}>
                <span className="cursor-help text-ink-muted">
                  <Info className="size-3.5" aria-hidden />
                  <span className="sr-only">{note}</span>
                </span>
              </Tooltip>
            )}
          </h3>
          {description && (
            <p className="text-xs leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((value) => !value)}
            aria-pressed={showTable}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors",
              showTable
                ? "border-accent/50 bg-accent/12 text-accent-bright"
                : "border-edge bg-surface-2 text-ink-muted hover:text-ink",
            )}
          >
            <Table2 className="size-3" aria-hidden />
            {showTable ? "Chart" : "Data"}
          </button>
        )}
      </figcaption>

      {legend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-edge px-4 py-2.5">
          {legend}
        </div>
      )}

      {showTable && table ? (
        <div className="max-h-[28rem] overflow-auto p-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-edge">
                {table.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-2 py-2 font-medium text-ink-secondary",
                      column.numeric ? "text-right" : "text-left",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index} className="border-b border-edge/50 last:border-0">
                  {table.columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-2 py-1.5 text-ink-secondary",
                        column.numeric ? "tnum text-right" : "text-left",
                      )}
                    >
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty ? (
        <div className="p-4">{empty}</div>
      ) : (
        <div className={cn("overflow-x-auto p-4", bodyClassName)}>
          <div style={minWidth ? { minWidth } : undefined}>{children}</div>
        </div>
      )}
    </figure>
  );
}

/** One legend entry: a colour swatch beside a text label. */
export function LegendItem({
  color,
  label,
  shape = "square",
}: {
  color: string;
  label: string;
  shape?: "square" | "line" | "dot";
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
      <span
        aria-hidden
        className={cn(
          "shrink-0",
          shape === "line" ? "h-0.5 w-4 rounded-full" : "size-2.5",
          shape === "dot" && "rounded-full",
          shape === "square" && "rounded-[2px]",
        )}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/** Continuous ramp legend for heatmaps, with labelled ends. */
export function RampLegend({
  from,
  to,
  stops,
  label,
}: {
  from: string;
  to: string;
  stops: string[];
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-muted">
      {label && <span>{label}</span>}
      <span>{from}</span>
      <span aria-hidden className="flex h-2.5 w-28 overflow-hidden rounded-full">
        {stops.map((stop, index) => (
          <span key={index} className="h-full flex-1" style={{ backgroundColor: stop }} />
        ))}
      </span>
      <span>{to}</span>
    </div>
  );
}
