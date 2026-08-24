/**
 * Display formatting.
 *
 * The governing rule (US8): **comparison always happens in base units, and
 * only presentation is rescaled**. A 4 TB drive is stored as `capacityGb:
 * 4000` and sorted, normalised and correlated as 4000; it merely *renders* as
 * "4 TB". Formatting never feeds back into arithmetic.
 */

/** What a missing value renders as, everywhere in the application. */
export const EMPTY_VALUE = "—";

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Trim trailing zeros so 2.50 renders as "2.5" but 2.00 renders as "2". */
export function formatTrimmed(value: number, maxDecimals = 2): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return rounded.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EMPTY_VALUE;
  return `$${formatNumber(value, 0)}`;
}

/** Large counts: 1_550_000 becomes "1.55M". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${formatTrimmed(value / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${formatTrimmed(value / 1_000, abs >= 10_000 ? 0 : 1)}K`;
  return formatTrimmed(value, 2);
}

/** Gigabytes, promoted to TB at 1000 and above. */
export function formatCapacityGb(value: number): string {
  return value >= 1000 ? `${formatTrimmed(value / 1000, 2)} TB` : `${formatTrimmed(value)} GB`;
}

/** Megabytes, promoted to GB at 1024 and above. */
export function formatCacheMb(value: number): string {
  return value >= 1024 ? `${formatTrimmed(value / 1024, 2)} GB` : `${formatTrimmed(value, 2)} MB`;
}

/** Megahertz, promoted to GHz at 1000 and above. */
export function formatMhz(value: number): string {
  return value >= 1000 ? `${formatTrimmed(value / 1000, 2)} GHz` : `${formatTrimmed(value)} MHz`;
}

/** Megabytes per second, promoted to GB/s at 1000 and above. */
export function formatThroughputMbs(value: number): string {
  return value >= 1000
    ? `${formatTrimmed(value / 1000, 2)} GB/s`
    : `${formatTrimmed(value)} MB/s`;
}

export function formatSignedPercent(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return EMPTY_VALUE;
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatTrimmed(value, decimals)}%`;
}

/** ISO date to a stable, locale-independent "6 Apr 2023". */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return EMPTY_VALUE;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return EMPTY_VALUE;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

export function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

/** Fractional year position, so release dates can sit on a continuous axis. */
export function isoToDecimalYear(iso: string | null): number | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return year + (month - 1) / 12 + (day - 1) / 365;
}
