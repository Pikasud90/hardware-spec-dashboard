import { getPolarity, type MetricPolarity } from "@/lib/hardware-math";

/**
 * Statistical primitives backing the analytics views.
 *
 * Everything here is null-tolerant: hardware datasets are inherently ragged
 * (older SKUs omit random-IOPS figures, some parts have no MSRP), and an
 * analysis pass must degrade to "fewer points" rather than to `NaN`.
 */

export type Nullable = number | null | undefined;

/** Strip nulls/NaN from a series. */
export function clean(values: readonly Nullable[]): number[] {
  return values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
}

export function mean(values: readonly Nullable[]): number | null {
  const xs = clean(values);
  if (xs.length === 0) return null;
  return xs.reduce((sum, x) => sum + x, 0) / xs.length;
}

export function median(values: readonly Nullable[]): number | null {
  const xs = clean(values).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
}

export function stdev(values: readonly Nullable[]): number | null {
  const xs = clean(values);
  if (xs.length < 2) return null;
  const mu = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const variance = xs.reduce((sum, x) => sum + (x - mu) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/** Linear-interpolated quantile of a series, `p` in [0, 1]. */
export function quantile(values: readonly Nullable[], p: number): number | null {
  const xs = clean(values).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  if (xs.length === 1) return xs[0];
  const position = (xs.length - 1) * Math.min(1, Math.max(0, p));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return xs[lower];
  return xs[lower] + (xs[upper] - xs[lower]) * (position - lower);
}

export interface FiveNumberSummary {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

export function fiveNumberSummary(values: readonly Nullable[]): FiveNumberSummary | null {
  const xs = clean(values);
  if (xs.length === 0) return null;
  return {
    min: Math.min(...xs),
    q1: quantile(xs, 0.25) as number,
    median: quantile(xs, 0.5) as number,
    q3: quantile(xs, 0.75) as number,
    max: Math.max(...xs),
    count: xs.length,
  };
}

/**
 * Min-max normalise to [0, 1] with 1 always meaning "best".
 *
 * Polarity is applied by inversion, so a lower-is-better metric such as TDP
 * still produces 1 for the most efficient part. A degenerate series (all
 * values equal) maps to 0.5 rather than dividing by zero.
 */
export function normalise(
  value: Nullable,
  values: readonly Nullable[],
  polarity: MetricPolarity,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const xs = clean(values);
  if (xs.length === 0) return null;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  if (max === min) return 0.5;
  const unit = (value - min) / (max - min);
  return polarity === "LOWER_BETTER" ? 1 - unit : unit;
}

/** Convenience wrapper that looks polarity up from the shared registry. */
export function normaliseByKey(
  key: string,
  value: Nullable,
  values: readonly Nullable[],
): number | null {
  return normalise(value, values, getPolarity(key));
}

/**
 * Percentile rank of `value` within `values`, polarity-aware.
 * Returns 0-100, where 100 means "best in this population".
 */
export function percentileRank(
  value: Nullable,
  values: readonly Nullable[],
  polarity: MetricPolarity,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const xs = clean(values);
  if (xs.length < 2) return null;
  const better = xs.filter((x) =>
    polarity === "LOWER_BETTER" ? x > value : x < value,
  ).length;
  const equal = xs.filter((x) => x === value).length;
  return ((better + equal / 2) / xs.length) * 100;
}

/** Rescale a raw series so the best entry becomes `ceiling` (default 100). */
export function indexAgainstBest(
  raw: Nullable,
  population: readonly Nullable[],
  ceiling = 100,
): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const xs = clean(population);
  if (xs.length === 0) return null;
  const best = Math.max(...xs);
  if (best <= 0) return null;
  return (raw / best) * ceiling;
}

/** Pearson product-moment correlation over pairwise-complete observations. */
export function pearson(xsRaw: readonly Nullable[], ysRaw: readonly Nullable[]): number | null {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < Math.min(xsRaw.length, ysRaw.length); i++) {
    const x = xsRaw[i];
    const y = ysRaw[i];
    if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
      pairs.push([x, y]);
    }
  }
  if (pairs.length < 3) return null;

  const n = pairs.length;
  const muX = pairs.reduce((s, [x]) => s + x, 0) / n;
  const muY = pairs.reduce((s, [, y]) => s + y, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (const [x, y] of pairs) {
    const dx = x - muX;
    const dy = y - muY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return null;
  return Math.max(-1, Math.min(1, numerator / denominator));
}

export interface RegressionLine {
  slope: number;
  intercept: number;
  r2: number;
}

/** Ordinary least squares fit, used for the generational trend line. */
export function linearRegression(
  xsRaw: readonly Nullable[],
  ysRaw: readonly Nullable[],
): RegressionLine | null {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < Math.min(xsRaw.length, ysRaw.length); i++) {
    const x = xsRaw[i];
    const y = ysRaw[i];
    if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
      pairs.push([x, y]);
    }
  }
  if (pairs.length < 3) return null;

  const n = pairs.length;
  const muX = pairs.reduce((s, [x]) => s + x, 0) / n;
  const muY = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [x, y] of pairs) {
    sxy += (x - muX) * (y - muY);
    sxx += (x - muX) ** 2;
  }
  if (sxx === 0) return null;

  const slope = sxy / sxx;
  const intercept = muY - slope * muX;
  const r = pearson(
    pairs.map(([x]) => x),
    pairs.map(([, y]) => y),
  );
  return { slope, intercept, r2: r === null ? 0 : r * r };
}

export interface ParetoPoint {
  id: string;
  x: number;
  y: number;
}

/**
 * Pareto frontier of a 2-D trade-off (e.g. price vs performance).
 *
 * A point is on the frontier when no other point is at least as good on both
 * axes and strictly better on one. Polarity per axis decides which direction
 * "good" points in, so the same routine handles price-vs-perf (minimise x,
 * maximise y) and power-vs-perf without special-casing.
 */
export function paretoFrontier(
  points: readonly ParetoPoint[],
  xPolarity: MetricPolarity,
  yPolarity: MetricPolarity,
): Set<string> {
  const better = (a: number, b: number, polarity: MetricPolarity) =>
    polarity === "LOWER_BETTER" ? a < b : a > b;
  const atLeast = (a: number, b: number, polarity: MetricPolarity) =>
    polarity === "LOWER_BETTER" ? a <= b : a >= b;

  const frontier = new Set<string>();
  for (const candidate of points) {
    const dominated = points.some(
      (other) =>
        other.id !== candidate.id &&
        atLeast(other.x, candidate.x, xPolarity) &&
        atLeast(other.y, candidate.y, yPolarity) &&
        (better(other.x, candidate.x, xPolarity) ||
          better(other.y, candidate.y, yPolarity)),
    );
    if (!dominated) frontier.add(candidate.id);
  }
  return frontier;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

/** Equal-width histogram; returns [] rather than throwing on an empty series. */
export function histogram(values: readonly Nullable[], binCount = 12): HistogramBin[] {
  const xs = clean(values);
  if (xs.length === 0) return [];
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  if (max === min) return [{ x0: min, x1: max, count: xs.length }];

  const width = (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }));
  for (const x of xs) {
    const index = Math.min(binCount - 1, Math.floor((x - min) / width));
    bins[index].count += 1;
  }
  return bins;
}
