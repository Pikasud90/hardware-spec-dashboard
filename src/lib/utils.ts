import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The categorical series ramp, in fixed slot order.
 *
 * Colours are assigned to entities by a stable key, never by rank or array
 * position, so filtering a chart down to fewer series never repaints the ones
 * that remain.
 */
export const SERIES_COLORS = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
  "var(--color-series-7)",
  "var(--color-series-8)",
] as const;

export const OTHER_COLOR = "var(--color-series-other)";

/**
 * Deterministic colour assignment: build the domain once (sorted, stable), then
 * index into it. `maxSlots` folds everything past the cap into "Other" — three
 * for scatter-type charts where all pairs are on screen simultaneously, up to
 * eight for bars and lines where only adjacent pairs need separating.
 */
export function makeColorScale(domain: readonly string[], maxSlots = 8) {
  const capped = domain.slice(0, Math.min(maxSlots, SERIES_COLORS.length));
  const lookup = new Map(capped.map((key, index) => [key, SERIES_COLORS[index]]));
  return {
    domain: capped,
    hasOther: domain.length > capped.length,
    of: (key: string) => lookup.get(key) ?? OTHER_COLOR,
  };
}

/** Sequential ramp step for a 0-1 magnitude. Index 0 sits nearest the surface. */
export function sequentialColor(unit: number | null): string {
  if (unit === null || !Number.isFinite(unit)) return "var(--color-surface-2)";
  const clamped = Math.min(1, Math.max(0, unit));
  const step = Math.round(clamped * 9);
  return `var(--color-seq-${step})`;
}

/**
 * Diverging ramp for a signed value, scaled by `extent`. Blue is the positive
 * pole, red the negative, with a neutral (not hued) midpoint.
 */
export function divergingColor(value: number | null, extent: number): string {
  if (value === null || !Number.isFinite(value) || extent <= 0) {
    return "var(--color-div-mid)";
  }
  const t = Math.min(1, Math.abs(value) / extent);
  if (t < 0.06) return "var(--color-div-mid)";
  const pole = value > 0 ? "var(--color-div-pos)" : "var(--color-div-neg)";
  return `color-mix(in oklab, ${pole} ${Math.round(20 + t * 80)}%, var(--color-div-mid))`;
}

/** Stable pluralisation for the small counts this application displays. */
export function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}
