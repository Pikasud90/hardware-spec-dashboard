import { CPUS } from "@/lib/data/cpus";
import { CPUS_AMD_LEGACY } from "@/lib/data/cpus-amd-legacy";
import { CPUS_AMD_MODERN } from "@/lib/data/cpus-amd-modern";
import { CPUS_APPLE } from "@/lib/data/cpus-apple";
import { CPUS_INTEL_LEGACY } from "@/lib/data/cpus-intel-legacy";
import { CPUS_INTEL_MODERN } from "@/lib/data/cpus-intel-modern";
import { GPUS } from "@/lib/data/gpus";
import { MEMORY } from "@/lib/data/memory";
import { MOTHERBOARDS } from "@/lib/data/motherboards";
import { PSUS } from "@/lib/data/psus";
import { STORAGE } from "@/lib/data/storage";
import { STORAGE_HDD } from "@/lib/data/storage-hdd";
import { deriveMetrics } from "@/lib/hardware-math";
import { indexAgainstBest } from "@/lib/stats";
import { buildSearchIndex, type SearchDocument } from "@/lib/search";
import {
  CATEGORIES,
  parseComponents,
  type Category,
  type ComponentEntity,
} from "@/lib/validations/component";

/**
 * The catalogue: validated entities plus every metric flattened into one
 * addressable record per component.
 *
 * Flattening matters more than it looks. Once `values` exists, the data grid,
 * the comparison matrix, the heatmap, the radar chart and the correlation
 * matrix all read metrics the same way — by key — so none of them can disagree
 * about what a metric is or where it lives.
 *
 * Assembly runs once at module load (build time for pre-rendered pages) and is
 * a pure function of the embedded data files.
 */

export type MetricValue = number | string | boolean | null;

export interface ResolvedComponent {
  id: string;
  slug: string;
  name: string;
  brand: string;
  series: string;
  category: Category;
  msrp: number | null;
  inrPrice: number | null;
  priceConfidence: "high" | "medium" | "low";
  availability: "available" | "limited" | "discontinued";
  releaseDate: string | null;
  summary: string;
  entity: ComponentEntity;
  /** Every metric for this component, keyed by metric id. */
  values: Record<string, MetricValue>;
}

/** Read a metric as a number, or null if it is absent or non-numeric. */
export function numericValue(
  component: ResolvedComponent | undefined,
  key: string,
): number | null {
  if (!component) return null;
  const value = component.values[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Raw index keys produced by the derivation pass, and the normalised 0-100
 * key each one becomes. Normalisation is per-category, against the best entry
 * in that category, so "100" always means "best CPU here" or "best GPU here".
 */
const NORMALISED_INDEX_KEYS: Record<string, string> = {
  singleThreadIndexRaw: "singleThreadIndex",
  multiThreadIndexRaw: "multiThreadIndex",
  gamingIndexRaw: "gamingIndex",
  rasterIndexRaw: "rasterIndex",
  perfPerWattRaw: "perfPerWatt",
  perfPerRupeeRaw: "perfPerRupee",
};

function flattenSpecs(entity: ComponentEntity): Record<string, MetricValue> {
  const flat: Record<string, MetricValue> = {};
  for (const [key, value] of Object.entries(entity.specs)) {
    flat[key] = value as MetricValue;
  }
  return flat;
}

function assemble(rawByCategory: Record<Category, unknown[]>): ResolvedComponent[] {
  const resolved: ResolvedComponent[] = [];

  for (const category of CATEGORIES) {
    const entities = parseComponents(rawByCategory[category]);

    // Pass 1 — flatten specs and compute every derived quantity.
    const staged = entities.map((entity) => ({
      entity,
      values: {
        ...flattenSpecs(entity),
        ...deriveMetrics(entity),
      } as Record<string, MetricValue>,
    }));

    // Pass 2 — rescale the raw indices against the best member of this
    // category, then drop the raw keys so only the 0-100 form is addressable.
    for (const [rawKey, normalisedKey] of Object.entries(NORMALISED_INDEX_KEYS)) {
      const population = staged.map((item) => {
        const value = item.values[rawKey];
        return typeof value === "number" ? value : null;
      });
      if (population.every((value) => value === null)) continue;

      staged.forEach((item, position) => {
        item.values[normalisedKey] = indexAgainstBest(population[position], population);
      });
    }
    for (const item of staged) {
      for (const rawKey of Object.keys(NORMALISED_INDEX_KEYS)) delete item.values[rawKey];
    }

    for (const { entity, values } of staged) {
      resolved.push({
        id: entity.id,
        slug: entity.slug,
        name: entity.name,
        brand: entity.brand,
        series: entity.series,
        category: entity.category,
        msrp: entity.msrp,
        inrPrice: entity.inrPrice,
        priceConfidence: entity.priceConfidence,
        availability: entity.availability,
        releaseDate: entity.releaseDate,
        summary: entity.summary,
        entity,
        values,
      });
    }
  }

  return resolved;
}

export const ALL_COMPONENTS: ResolvedComponent[] = assemble({
  // Split across files by vendor and era purely for editability; the catalogue
  // treats them as one list.
  cpu: [
    ...CPUS,
    ...CPUS_INTEL_LEGACY,
    ...CPUS_INTEL_MODERN,
    ...CPUS_AMD_LEGACY,
    ...CPUS_AMD_MODERN,
    ...CPUS_APPLE,
  ],
  gpu: GPUS,
  ram: MEMORY,
  storage: [...STORAGE, ...STORAGE_HDD],
  motherboard: MOTHERBOARDS,
  psu: PSUS,
});

export const COMPONENTS_BY_CATEGORY: Record<Category, ResolvedComponent[]> =
  CATEGORIES.reduce(
    (accumulator, category) => {
      accumulator[category] = ALL_COMPONENTS.filter(
        (component) => component.category === category,
      );
      return accumulator;
    },
    {} as Record<Category, ResolvedComponent[]>,
  );

export const COMPONENT_BY_SLUG: Map<string, ResolvedComponent> = new Map(
  ALL_COMPONENTS.map((component) => [component.slug, component]),
);

export const COMPONENT_BY_ID: Map<string, ResolvedComponent> = new Map(
  ALL_COMPONENTS.map((component) => [component.id, component]),
);

/** Distinct brands present in a category, alphabetically. */
export function brandsIn(category: Category): string[] {
  return [
    ...new Set(COMPONENTS_BY_CATEGORY[category].map((component) => component.brand)),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * A category-specific secondary grouping used by the filter bar — socket for
 * processors and boards, memory generation for kits, interface for drives.
 */
export function groupingKeyFor(category: Category): { key: string; label: string } | null {
  switch (category) {
    case "cpu":
      return { key: "socket", label: "Socket" };
    case "motherboard":
      return { key: "chipset", label: "Chipset" };
    case "ram":
      return { key: "generation", label: "Generation" };
    case "storage":
      return { key: "interface", label: "Interface" };
    case "gpu":
      return { key: "architecture", label: "Architecture" };
    case "psu":
      return { key: "efficiencyRating", label: "80 PLUS tier" };
  }
}

export function groupValuesIn(category: Category): string[] {
  const grouping = groupingKeyFor(category);
  if (!grouping) return [];
  const values = COMPONENTS_BY_CATEGORY[category]
    .map((component) => component.values[grouping.key])
    .filter((value): value is string => typeof value === "string");
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Search documents cover the display name plus every text-valued spec. */
function toSearchDocument(component: ResolvedComponent): SearchDocument {
  const textualSpecs = Object.values(component.values)
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return {
    id: component.id,
    name: component.name,
    keywords: `${component.brand} ${component.series} ${component.category} ${textualSpecs}`,
  };
}

export const SEARCH_INDEX = buildSearchIndex(ALL_COMPONENTS.map(toSearchDocument));

export const CATALOGUE_STATS = {
  total: ALL_COMPONENTS.length,
  byCategory: CATEGORIES.reduce(
    (accumulator, category) => {
      accumulator[category] = COMPONENTS_BY_CATEGORY[category].length;
      return accumulator;
    },
    {} as Record<Category, number>,
  ),
  brands: new Set(ALL_COMPONENTS.map((component) => component.brand)).size,
};
