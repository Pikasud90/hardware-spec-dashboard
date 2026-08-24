"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { normalise } from "@/lib/stats";
import { ChartFrame, LegendItem } from "@/components/charts/chart-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { SERIES_COLORS } from "@/lib/utils";

/**
 * Multi-axis normalised profile.
 *
 * Every spoke is min-max normalised across only the components on screen and
 * oriented by polarity, so the outer edge is always "best of this group".
 * That makes shape readable — a card that is wide on memory spokes and narrow
 * on compute spokes has a visibly different silhouette from its rival — while
 * the absolute numbers stay available in the tooltip and the data table.
 */

interface RadarDatum {
  axis: string;
  metricKey: string;
  [componentId: string]: number | string | null;
}

export function RadarCompare({
  components,
  metrics,
  title = "Normalised performance profile",
  maxAxes = 8,
}: {
  components: ResolvedComponent[];
  metrics: ResolvedMetric[];
  title?: string;
  maxAxes?: number;
}) {
  const { data, usedMetrics } = React.useMemo(() => {
    const candidates = metrics.filter((metric) => {
      const values = components.map((component) => numericValue(component, metric.key));
      const present = values.filter((value) => value !== null);
      return present.length === components.length && new Set(present).size > 1;
    });

    // A radar with more than ~8 spokes stops being legible; take the metrics
    // that separate the group most, measured by normalised spread.
    const ranked = [...candidates].sort((a, b) => {
      const spread = (metric: ResolvedMetric) => {
        const values = components.map((component) => numericValue(component, metric.key));
        const units = values.map((value) => normalise(value, values, metric.polarity) ?? 0);
        return Math.max(...units) - Math.min(...units);
      };
      return spread(b) - spread(a);
    });

    const chosen = ranked.slice(0, maxAxes);
    const rows: RadarDatum[] = chosen.map((metric) => {
      const values = components.map((component) => numericValue(component, metric.key));
      const row: RadarDatum = { axis: metric.short, metricKey: metric.key };
      components.forEach((component, index) => {
        row[component.id] = Math.round((normalise(values[index], values, metric.polarity) ?? 0) * 100);
        row[`${component.id}__raw`] = formatMetricValue(metric, values[index]);
      });
      return row;
    });

    return { data: rows, usedMetrics: chosen };
  }, [components, metrics, maxAxes]);

  const colorOf = React.useCallback(
    (componentId: string) => {
      const index = components.findIndex((component) => component.id === componentId);
      return SERIES_COLORS[Math.max(0, index) % SERIES_COLORS.length];
    },
    [components],
  );

  if (data.length < 3) {
    return (
      <ChartFrame title={title}>
        <EmptyState
          title="Not enough separating metrics"
          description="A radar needs at least three axes on which these components actually differ and all have values."
        />
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={title}
      description={`Each axis is normalised across the ${components.length} selected components — the outer edge is the best value in this group, not an absolute maximum.`}
      note="Axes are chosen automatically as the metrics on which this group differs most. Normalisation is polarity-aware, so lower-is-better metrics are inverted."
      legend={components.map((component) => (
        <LegendItem key={component.id} color={colorOf(component.id)} label={component.name} />
      ))}
      table={{
        columns: [
          { key: "axis", label: "Metric" },
          ...components.map((component) => ({
            key: component.id,
            label: component.name,
            numeric: true,
          })),
        ],
        rows: data.map((row) => {
          const metric = usedMetrics.find((entry) => entry.key === row.metricKey);
          const record: Record<string, string> = { axis: metric?.label ?? String(row.axis) };
          for (const component of components) {
            record[component.id] = String(row[`${component.id}__raw`] ?? "—");
          }
          return record;
        }),
      }}
    >
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--color-edge-strong)" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--color-ink-secondary)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 9 }}
              axisLine={false}
              tickCount={5}
            />
            <RechartsTooltip
              cursor={{ stroke: "var(--color-edge-strong)" }}
              contentStyle={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-edge-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-ink)", fontWeight: 600 }}
              formatter={(value, name, item) => {
                const raw = item?.payload?.[`${name}__raw`];
                const component = components.find((entry) => entry.id === name);
                return [
                  `${raw ?? value} (${value}/100)`,
                  component?.name ?? String(name),
                ];
              }}
            />
            {components.map((component) => (
              <Radar
                key={component.id}
                name={component.id}
                dataKey={component.id}
                stroke={colorOf(component.id)}
                strokeWidth={2}
                fill={colorOf(component.id)}
                fillOpacity={0.14}
                dot={{ r: 3, strokeWidth: 0, fill: colorOf(component.id) }}
                isAnimationActive={false}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
