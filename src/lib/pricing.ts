/**
 * Provenance for the Indian pricing in this catalogue.
 *
 * Prices were researched from Indian retailers and price aggregators rather
 * than converted from US MSRP, because Indian pricing diverges from a simple
 * currency conversion by a wide and category-dependent margin — import duty,
 * GST, channel structure and local demand all move it.
 *
 * They are a snapshot, not a feed. Nothing in this application fetches prices
 * at runtime, by design: the app has to work offline. So every price carries a
 * confidence level and a capture date, and the build planner lets you override
 * any of them with a real quote.
 */

/** Date the price snapshot was taken. */
export const PRICE_CAPTURED_ON = "24 August 2026";

export const PRICE_SOURCE_NOTE =
  "Researched from Indian retailers and price aggregators (getpc.co.in, MDComputers, PrimeABGB, Computech).";

/**
 * Categories where prices are known to be unusually unstable, with the reason.
 * Surfaced in the UI so a wide error bar is explained rather than mysterious.
 */
export const VOLATILE_CATEGORY_NOTES: Record<string, string> = {
  ram: "DDR5 pricing tripled through the 2026 DRAM shortage and listings disagree by up to 4x between retailers. Memory is the least reliable line in any build estimate right now.",
  gpu: "Graphics card pricing in India carries large and inconsistent import margins, and top-end cards frequently sell above listed price.",
};

/** GST rate applied to computer components in India. */
export const GST_RATE = 0.18;

/**
 * Split a GST-inclusive retail price into base and tax components.
 * Indian retail prices are quoted inclusive, so the tax is extracted from the
 * total rather than added to it.
 */
export function splitGst(inclusivePrice: number): { base: number; gst: number } {
  const base = inclusivePrice / (1 + GST_RATE);
  return { base, gst: inclusivePrice - base };
}
