"use client";

import * as React from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { paretoFrontier } from "@/lib/stats";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { makeColorScale, OTHER_COLOR } from "@/lib/utils";

/**
 * Two-metric trade-off with the efficient frontier drawn in.
 *
 * The frontier is the set of components that nothing else beats on both axes
 * at once — the honest answer to "which of these are actually worth
 * considering". Everything behind it is dominated: some other component is at
 * least as good on both measures.
 *
 * Categorical colour is capped at three brands here, not eight. In a scatter
 * every pair of colours is on screen simultaneously, and beyond three slots the
 * palette cannot hold the colour-blind separation floor for all pairs; the
 * remainder folds into a neutral "Other" rather than being given a hue that
 * would be indistinguishable.
 */

interface Point {
  id: string;
  name: string;
  brand: string;
  x: number;
  y: number;
  onFrontier: boolean;
  xLabel: string;
  yLabel: string;
}

export function ParetoScatter({
  components,
  xMetric,
  yMetric,
  title,
}: {
  components: ResolvedComponent[];
  xMetric: ResolvedMetric;
  yMetric: ResolvedMetric;
  title?: string;
}) {
  const { points, colorScale } = React.useMemo(() => {
    const raw = components
      .map((component) => {
        const x = numericValue(component, xMetric.key);
        const y = numericValue(component, yMetric.key);
        if (x === null || y === null) return null;
        return {
          id: component.id,
          name: component.name,
          brand: component.brand,
          x,
          y,
          xLabel: formatMetricValue(xMetric, x),
          yLabel: formatMetricValue(yMetric, y),
        };
      })
      .filter((point): point is Omit<Point, "onFrontier"> => point !== null);

    const frontier = paretoFrontier(raw, xMetric.polarity, yMetric.polarity);

    // Brand ordering by frequency, so the colour assignment is stable and the
    // three most-represented brands get the distinct hues.
    const counts = new Map<string, number>();
    for (const point of raw) counts.set(point.brand, (counts.get(point.brand) ?? 0) + 1);
    const ordered = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([brand]) => brand);

    return {
      points: raw.map((point) => ({ ...point, onFrontier: frontier.has(point.id) })),
      colorScale: makeColorScale(ordered, 3),
    };
  }, [components, xMetric, yMetric]);

  const frontierPoints = React.useMemo(
    () =>
      points
        .filter((point) => point.onFrontier)
        .sort((a, b) => a.x - b.x),
    [points],
  );

  const heading =
    title ?? `${yMetric.label} versus ${xMetric.label}`;

  if (points.length < 3) {
    return (
      <ChartFrame title={heading}>
        <EmptyState
          title="Not enough data points"
          description={`Fewer than three components have values for both ${xMetric.label} and ${yMetric.label}.`}
        />
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={heading}
      description={`${frontierPoints.length} of ${points.length} components sit on the efficient frontier — nothing in the catalogue beats them on both axes at once.`}
      note={`${xMetric.polarity === "LOWER_BETTER" ? "Lower" : "Higher"} ${xMetric.short} and ${yMetric.polarity === "LOWER_BETTER" ? "lower" : "higher"} ${yMetric.short} are better, which is the direction the frontier is computed in.`}
      legend={
        <>
          {colorScale.domain.map((brand) => (
            <LegendItem key={brand} color={colorScale.of(brand)} label={brand} shape="dot" />
          ))}
          {colorScale.hasOther && (
            <LegendItem color={OTHER_COLOR} label="Other brands" shape="dot" />
          )}
          <LegendItem
            color="var(--color-good)"
            label="On the efficient frontier"
            shape="line"
          />
        </>
      }
      table={{
        columns: [
          { key: "name", label: "Component" },
          { key: "brand", label: "Brand" },
          { key: "x", label: xMetric.label, numeric: true },
          { key: "y", label: yMetric.label, numeric: true },
          { key: "frontier", label: "Frontier" },
        ],
        rows: points
          .slice()
          .sort((a, b) => b.y - a.y)
          .map((point) => ({
            name: point.name,
            brand: point.brand,
            x: point.xLabel,
            y: point.yLabel,
            frontier: point.onFrontier ? "Yes" : "—",
          })),
      }}
    >
      <div className="h-[26rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 20, bottom: 34, left: 8 }}>
            <CartesianGrid stroke="var(--color-edge)" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="x"
              name={xMetric.label}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-edge-strong)" }}
              label={{
                value: `${xMetric.label}${xMetric.unit ? ` (${xMetric.unit})` : ""}`,
                position: "insideBottom",
                offset: -18,
                fill: "var(--color-ink-secondary)",
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yMetric.label}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-edge-strong)" }}
              width={64}
              label={{
                value: yMetric.short,
                angle: -90,
                position: "insideLeft",
                fill: "var(--color-ink-secondary)",
                fontSize: 11,
              }}
            />
            <ZAxis range={[70, 70]} />
            <RechartsTooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--color-edge-strong)" }}
              contentStyle={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-edge-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as Point;
                return (
                  <div className="rounded-lg border border-edge-strong bg-surface-2 px-3 py-2 text-xs">
                    <p className="font-medium text-ink">{point.name}</p>
                    <p className="text-ink-muted">{point.brand}</p>
                    <p className="tnum mt-1 text-ink-secondary">
                      {xMetric.short}: {point.xLabel}
                    </p>
                    <p className="tnum text-ink-secondary">
                      {yMetric.short}: {point.yLabel}
                    </p>
                    {point.onFrontier && (
                      <p className="mt-1 font-medium text-good">On the frontier</p>
                    )}
                  </div>
                );
              }}
            />
            {/* Frontier drawn first so the connecting line sits behind the marks. */}
            <Scatter
              data={frontierPoints}
              line={{ stroke: "var(--color-good)", strokeWidth: 2 }}
              shape="circle"
              fill="var(--color-good)"
              isAnimationActive={false}
              legendType="none"
            />
            <Scatter data={points} isAnimationActive={false} legendType="none">
              {points.map((point) => (
                <Cell
                  key={point.id}
                  fill={colorScale.of(point.brand)}
                  // A 2px surface ring keeps overlapping marks separable.
                  stroke={point.onFrontier ? "var(--color-good)" : "var(--color-surface-1)"}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
