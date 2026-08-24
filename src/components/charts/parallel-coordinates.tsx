"use client";

import * as React from "react";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { normalise } from "@/lib/stats";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { makeColorScale, OTHER_COLOR } from "@/lib/utils";

/**
 * Parallel coordinates across several normalised metrics at once.
 *
 * Each vertical axis is one metric, normalised and polarity-oriented so the
 * top of every axis is "best". A component is a line crossing all of them, so
 * a balanced part reads as a flat line near the top while a specialised one
 * zig-zags — which is the pattern that a table of numbers hides.
 *
 * Lines are drawn at low opacity with hover raising one to full strength;
 * with 30 components on screen, that is what keeps individual paths traceable.
 */

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 400;
const PADDING = { top: 24, right: 24, bottom: 52, left: 24 };

export function ParallelCoordinates({
  components,
  metrics,
  title = "Parallel coordinates",
  maxAxes = 7,
  highlightIds,
}: {
  components: ResolvedComponent[];
  metrics: ResolvedMetric[];
  title?: string;
  maxAxes?: number;
  /** Ids drawn at full strength regardless of hover. */
  highlightIds?: readonly string[];
}) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const { axes, lines, colorScale } = React.useMemo(() => {
    const viable = metrics
      .filter((metric) => {
        const values = components.map((component) => numericValue(component, metric.key));
        const present = values.filter((value) => value !== null);
        return present.length >= components.length * 0.6 && new Set(present).size > 1;
      })
      .slice(0, maxAxes);

    const columns = viable.map((metric) => {
      const values = components.map((component) => numericValue(component, metric.key));
      return { metric, values };
    });

    const paths = components.map((component, rowIndex) => {
      const points = columns.map((column) => ({
        unit: normalise(column.values[rowIndex], column.values, column.metric.polarity),
        label: formatMetricValue(column.metric, column.values[rowIndex]),
      }));
      return { component, points };
    });

    const counts = new Map<string, number>();
    for (const component of components) {
      counts.set(component.brand, (counts.get(component.brand) ?? 0) + 1);
    }
    const ordered = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([brand]) => brand);

    return { axes: columns, lines: paths, colorScale: makeColorScale(ordered, 3) };
  }, [components, metrics, maxAxes]);

  if (axes.length < 3) {
    return (
      <ChartFrame title={title}>
        <EmptyState
          title="Not enough comparable axes"
          description="Parallel coordinates need at least three metrics with values across most of the selection."
        />
      </ChartFrame>
    );
  }

  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const axisX = (index: number) =>
    PADDING.left + (axes.length === 1 ? plotWidth / 2 : (index / (axes.length - 1)) * plotWidth);
  const valueY = (unit: number) => PADDING.top + (1 - unit) * plotHeight;

  return (
    <ChartFrame
      title={title}
      description={`${components.length} components across ${axes.length} normalised axes. Every axis is oriented so higher is better; a line near the top throughout is a well-rounded part.`}
      note="Axes are normalised independently within the current selection, so the top of an axis is the best value present here rather than an absolute ceiling."
      legend={
        <>
          {colorScale.domain.map((brand) => (
            <LegendItem key={brand} color={colorScale.of(brand)} label={brand} shape="line" />
          ))}
          {colorScale.hasOther && (
            <LegendItem color={OTHER_COLOR} label="Other brands" shape="line" />
          )}
        </>
      }
      table={{
        columns: [
          { key: "name", label: "Component" },
          ...axes.map((axis) => ({
            key: axis.metric.key,
            label: axis.metric.short,
            numeric: true,
          })),
        ],
        rows: lines.map((line) => {
          const record: Record<string, string> = { name: line.component.name };
          axes.forEach((axis, index) => {
            record[axis.metric.key] = line.points[index].label;
          });
          return record;
        }),
      }}
      minWidth={640}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-[24rem] w-full"
        role="img"
        aria-label={`${title}: ${components.length} components across ${axes.length} metrics`}
      >
        {/* Axes */}
        {axes.map((axis, index) => (
          <g key={axis.metric.key}>
            <line
              x1={axisX(index)}
              y1={PADDING.top}
              x2={axisX(index)}
              y2={PADDING.top + plotHeight}
              stroke="var(--color-edge-strong)"
              strokeWidth={1}
            />
            <text
              x={axisX(index)}
              y={PADDING.top + plotHeight + 22}
              textAnchor="middle"
              className="fill-[var(--color-ink-secondary)] text-[11px]"
            >
              {axis.metric.short}
            </text>
            <text
              x={axisX(index)}
              y={PADDING.top + plotHeight + 38}
              textAnchor="middle"
              className="fill-[var(--color-ink-muted)] text-[9px]"
            >
              {axis.metric.polarity === "LOWER_BETTER" ? "lower is better" : "higher is better"}
            </text>
            <text
              x={axisX(index)}
              y={PADDING.top - 8}
              textAnchor="middle"
              className="fill-[var(--color-ink-muted)] text-[9px]"
            >
              best
            </text>
          </g>
        ))}

        {/* Component paths */}
        {lines.map(({ component, points }) => {
          const usable = points
            .map((point, index) => ({ ...point, index }))
            .filter((point) => point.unit !== null);
          if (usable.length < 2) return null;

          const d = usable
            .map(
              (point, order) =>
                `${order === 0 ? "M" : "L"} ${axisX(point.index)} ${valueY(point.unit as number)}`,
            )
            .join(" ");

          const emphasised =
            hovered === component.id || highlightIds?.includes(component.id) === true;
          const dimmed = hovered !== null && hovered !== component.id;

          return (
            <g key={component.id}>
              <path
                d={d}
                fill="none"
                stroke={colorScale.of(component.brand)}
                strokeWidth={emphasised ? 3 : 1.5}
                strokeOpacity={emphasised ? 1 : dimmed ? 0.12 : 0.45}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {emphasised &&
                usable.map((point) => (
                  <circle
                    key={point.index}
                    cx={axisX(point.index)}
                    cy={valueY(point.unit as number)}
                    r={4}
                    fill={colorScale.of(component.brand)}
                    stroke="var(--color-surface-1)"
                    strokeWidth={2}
                  />
                ))}
              {/* Wide invisible stroke gives the thin line a usable hit target. */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                onMouseEnter={() => setHovered(component.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <title>{component.name}</title>
              </path>
            </g>
          );
        })}

        {hovered && (
          <text
            x={PADDING.left}
            y={16}
            className="fill-[var(--color-ink)] text-[12px] font-medium"
          >
            {components.find((component) => component.id === hovered)?.name}
          </text>
        )}
      </svg>
    </ChartFrame>
  );
}
