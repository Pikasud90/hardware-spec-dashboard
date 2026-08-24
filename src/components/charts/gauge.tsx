"use client";

import * as React from "react";
import { formatMetricValue, type ResolvedMetric } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * Single-value radial gauge with the population range as its scale.
 *
 * The arc is filled by the value's polarity-aware position within the
 * category's observed range, so a full arc means "best in category" rather
 * than an arbitrary maximum. The literal value is the hero number; the arc is
 * context, not the reading.
 */
export function Gauge({
  metric,
  value,
  min,
  max,
  label,
  className,
}: {
  metric: ResolvedMetric;
  value: number | null;
  min: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const unit =
    value === null || max === min
      ? null
      : metric.polarity === "LOWER_BETTER"
        ? 1 - (value - min) / (max - min)
        : (value - min) / (max - min);

  const clamped = unit === null ? 0 : Math.min(1, Math.max(0, unit));

  // 240-degree arc, opening downward.
  const RADIUS = 46;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ARC_FRACTION = 240 / 360;
  const arcLength = CIRCUMFERENCE * ARC_FRACTION;

  const tone =
    unit === null ? "muted" : clamped >= 0.75 ? "good" : clamped <= 0.25 ? "critical" : "accent";

  const strokeColor =
    tone === "good"
      ? "var(--color-good)"
      : tone === "critical"
        ? "var(--color-critical)"
        : tone === "accent"
          ? "var(--color-accent)"
          : "var(--color-edge-strong)";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-edge bg-surface-2/40 p-3",
        className,
      )}
    >
      <svg viewBox="0 0 120 100" className="h-20 w-28" role="img" aria-label={
        `${metric.label}: ${formatMetricValue(metric, value)}`
      }>
        <g transform="rotate(150 60 56)">
          <circle
            cx={60}
            cy={56}
            r={RADIUS}
            fill="none"
            stroke="var(--color-surface-3)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
          />
          <circle
            cx={60}
            cy={56}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${arcLength * clamped} ${CIRCUMFERENCE}`}
          />
        </g>
        <text
          x={60}
          y={58}
          textAnchor="middle"
          className="tnum fill-[var(--color-ink)] text-[15px] font-semibold"
        >
          {formatMetricValue(metric, value)}
        </text>
        <text
          x={60}
          y={74}
          textAnchor="middle"
          className="fill-[var(--color-ink-muted)] text-[8px]"
        >
          {metric.polarity === "LOWER_BETTER" ? "lower is better" : "higher is better"}
        </text>
      </svg>
      <span className="text-center text-[11px] leading-tight text-ink-secondary">
        {label ?? metric.label}
      </span>
    </div>
  );
}
