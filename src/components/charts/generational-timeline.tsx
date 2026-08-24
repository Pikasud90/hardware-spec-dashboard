"use client";

import * as React from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { linearRegression } from "@/lib/stats";
import { isoToDecimalYear, formatIsoDate, formatTrimmed } from "@/lib/format";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { makeColorScale, OTHER_COLOR } from "@/lib/utils";

/**
 * A metric plotted against release date, with an ordinary-least-squares trend.
 *
 * This is how generational progress becomes visible: the slope quantifies the
 * annual rate of improvement, and the parts sitting furthest above the line are
 * the ones that beat their own generation rather than merely arriving later.
 *
 * The fit is reported with its R² so a weak trend is not read as a strong one.
 */
interface TimelinePoint {
  id: string;
  name: string;
  brand: string;
  x: number;
  y: number;
  date: string;
  yLabel: string;
}

export function GenerationalTimeline({
  components,
  metric,
  title,
}: {
  components: ResolvedComponent[];
  metric: ResolvedMetric;
  title?: string;
}) {
  const { points, trend, trendLine } = React.useMemo(() => {
    const raw: TimelinePoint[] = components
      .map((component) => {
        const x = isoToDecimalYear(component.releaseDate);
        const y = numericValue(component, metric.key);
        if (x === null || y === null) return null;
        return {
          id: component.id,
          name: component.name,
          brand: component.brand,
          x,
          y,
          date: formatIsoDate(component.releaseDate),
          yLabel: formatMetricValue(metric, y),
        };
      })
      .filter((point): point is TimelinePoint => point !== null);

    const fit = linearRegression(
      raw.map((point) => point.x),
      raw.map((point) => point.y),
    );

    if (!fit || raw.length < 3) return { points: raw, trend: fit, trendLine: [] };

    const xs = raw.map((point) => point.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    return {
      points: raw,
      trend: fit,
      trendLine: [
        { x: min, trend: fit.slope * min + fit.intercept },
        { x: max, trend: fit.slope * max + fit.intercept },
      ],
    };
  }, [components, metric]);

  const colorScale = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const point of points) counts.set(point.brand, (counts.get(point.brand) ?? 0) + 1);
    return makeColorScale(
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([brand]) => brand),
      3,
    );
  }, [points]);

  const heading = title ?? `${metric.label} over time`;

  if (points.length < 3) {
    return (
      <ChartFrame title={heading}>
        <EmptyState
          title="Not enough dated components"
          description={`Fewer than three components have both a release date and a value for ${metric.label}.`}
        />
      </ChartFrame>
    );
  }

  const chartData = [...points.map((point) => ({ ...point })), ...trendLine];

  return (
    <ChartFrame
      title={heading}
      description={
        trend
          ? `Trend: ${formatTrimmed(trend.slope, 1)} ${metric.unit ?? "units"} per year (R² = ${formatTrimmed(trend.r2, 2)}). Parts above the line beat their own generation.`
          : "Not enough spread to fit a trend."
      }
      note="An ordinary-least-squares fit across release dates. R² states how much of the variation the date alone explains — a low value means the generation is a poor predictor of this metric."
      readingGuide={[
        { label: "Each dot", text: "One component, positioned horizontally by its release date and vertically by the selected specification." },
        { label: "Dot colour", text: "The brand, capped at three distinct colours." },
        { label: "Dashed line", text: "A least-squares trend through all the points — the average rate of improvement per year." },
        { label: "Above the line", text: "The part beat its own generation: better than the trend predicted for its release date. These are usually the ones remembered as exceptional." },
        { label: "Below the line", text: "Underperformed for its era, often because it was a cut-down variant or a refresh rather than a new design." },
        { label: "R²", text: "How much of the spread the release date alone explains. Near 1 means steady generational progress; near 0 means the date tells you very little and tier matters far more." },
      ]}
      takeaway="How fast this specification has actually improved over time, and which parts beat the trend of their own generation."
      legend={
        <>
          {colorScale.domain.map((brand) => (
            <LegendItem key={brand} color={colorScale.of(brand)} label={brand} shape="dot" />
          ))}
          {colorScale.hasOther && (
            <LegendItem color={OTHER_COLOR} label="Other brands" shape="dot" />
          )}
          <LegendItem color="var(--color-ink-muted)" label="Linear trend" shape="line" />
        </>
      }
      table={{
        columns: [
          { key: "name", label: "Component" },
          { key: "date", label: "Released" },
          { key: "value", label: metric.label, numeric: true },
        ],
        rows: [...points]
          .sort((a, b) => a.x - b.x)
          .map((point) => ({ name: point.name, date: point.date, value: point.yLabel })),
      }}
    >
      <div className="h-[24rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 20, bottom: 24, left: 8 }}>
            <CartesianGrid stroke="var(--color-edge)" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="x"
              domain={["dataMin - 0.3", "dataMax + 0.3"]}
              tickFormatter={(value: number) => String(Math.round(value))}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-edge-strong)" }}
              allowDuplicatedCategory={false}
            />
            <YAxis
              type="number"
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-edge-strong)" }}
              width={64}
              label={{
                value: metric.short,
                angle: -90,
                position: "insideLeft",
                fill: "var(--color-ink-secondary)",
                fontSize: 11,
              }}
            />
            <ZAxis range={[70, 70]} />
            <RechartsTooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--color-edge-strong)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as Partial<TimelinePoint>;
                if (!point.name) return null;
                return (
                  <div className="rounded-lg border border-edge-strong bg-surface-2 px-3 py-2 text-xs">
                    <p className="font-medium text-ink">{point.name}</p>
                    <p className="text-ink-muted">{point.date}</p>
                    <p className="tnum mt-1 text-ink-secondary">
                      {metric.short}: {point.yLabel}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke="var(--color-ink-muted)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
              legendType="none"
            />
            <Scatter dataKey="y" isAnimationActive={false} legendType="none">
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    "brand" in entry && typeof entry.brand === "string"
                      ? colorScale.of(entry.brand)
                      : "transparent"
                  }
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
