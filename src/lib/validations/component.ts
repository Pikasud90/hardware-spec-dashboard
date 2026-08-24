import { z } from "zod";

/**
 * Runtime contract for every hardware record in the catalogue.
 *
 * The dataset is embedded in the bundle rather than fetched, but it is still
 * parsed through these schemas at module-load time. That turns a malformed or
 * hand-edited data file into one loud, precise error at build time instead of
 * a scatter of `undefined` reads inside the comparison grid (US3).
 *
 * `releaseDate` is an ISO `YYYY-MM-DD` string rather than a `Date`. Static
 * export serialises page props, and `Date` instances do not survive that
 * boundary intact; a string does, and is trivially widened where needed.
 */

export const CATEGORIES = ["cpu", "gpu", "ram", "storage", "motherboard"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cpu: "Processors",
  gpu: "Graphics Cards",
  ram: "Memory",
  storage: "Storage",
  motherboard: "Motherboards",
};

export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "SSD",
  motherboard: "Mobo",
};

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "releaseDate must be an ISO YYYY-MM-DD string");

const MemoryGeneration = z.enum(["DDR4", "DDR5"]);

/* ------------------------------------------------------------------- CPU */

export const CpuSpecsSchema = z.object({
  socket: z.string(),
  architecture: z.string(),
  codename: z.string(),
  processNodeNm: z.number().positive(),
  totalCores: z.number().int().positive(),
  pCores: z.number().int().nonnegative().default(0),
  eCores: z.number().int().nonnegative().default(0),
  threads: z.number().int().positive(),
  baseClockGhz: z.number().positive(),
  boostClockGhz: z.number().positive(),
  l2CacheMb: z.number().nonnegative(),
  l3CacheMb: z.number().nonnegative(),
  tdpWatts: z.number().positive(),
  pl2Watts: z.number().positive().nullable().default(null),
  integratedGraphics: z.string().nullable().default(null),
  pcieVersion: z.string(),
  pcieLanes: z.number().int().positive(),
  memoryType: MemoryGeneration,
  memoryChannels: z.number().int().positive(),
  maxMemorySpeedMts: z.number().positive(),
  unlocked: z.boolean().default(false),
  stackedCache: z.boolean().default(false),
  coolerIncluded: z.boolean().default(false),
});
export type CpuSpecs = z.infer<typeof CpuSpecsSchema>;

/* ------------------------------------------------------------------- GPU */

export const GpuSpecsSchema = z.object({
  architecture: z.string(),
  codename: z.string(),
  processNodeNm: z.number().positive(),
  cudaCoresOrShaders: z.number().int().positive(),
  rtCores: z.number().int().nonnegative().nullable().default(null),
  tensorCores: z.number().int().nonnegative().nullable().default(null),
  baseClockMhz: z.number().positive(),
  boostClockMhz: z.number().positive(),
  vramGb: z.number().positive(),
  vramType: z.string(),
  busWidthBits: z.number().positive(),
  memorySpeedGbps: z.number().positive(),
  lastLevelCacheMb: z.number().nonnegative().nullable().default(null),
  tgpWatts: z.number().positive(),
  slotWidth: z.number().positive(),
  lengthMm: z.number().positive(),
  powerConnectors: z.string(),
  pcieInterface: z.string(),
});
export type GpuSpecs = z.infer<typeof GpuSpecsSchema>;

/* ------------------------------------------------------------------- RAM */

export const RamSpecsSchema = z.object({
  generation: MemoryGeneration,
  capacityGb: z.number().positive(),
  moduleCount: z.number().int().positive(),
  moduleCapacityGb: z.number().positive(),
  modules: z.string(),
  speedMts: z.number().positive(),
  casLatency: z.number().positive(),
  timings: z.string(),
  voltage: z.number().positive(),
  ecc: z.boolean().default(false),
  heightMm: z.number().positive(),
  profileSupport: z.string(),
  rgb: z.boolean().default(false),
});
export type RamSpecs = z.infer<typeof RamSpecsSchema>;

/* --------------------------------------------------------------- Storage */

export const StorageSpecsSchema = z.object({
  formFactor: z.string(),
  interface: z.string(),
  capacityGb: z.number().positive(),
  nandType: z.string(),
  controller: z.string(),
  dramCacheMb: z.number().nonnegative().nullable().default(null),
  seqReadMb: z.number().positive(),
  seqWriteMb: z.number().positive(),
  randomReadIops: z.number().positive().nullable().default(null),
  randomWriteIops: z.number().positive().nullable().default(null),
  tbw: z.number().positive(),
  warrantyYears: z.number().positive(),
  heatsink: z.boolean().default(false),
});
export type StorageSpecs = z.infer<typeof StorageSpecsSchema>;

/* ----------------------------------------------------------- Motherboard */

export const MotherboardSpecsSchema = z.object({
  socket: z.string(),
  chipset: z.string(),
  formFactor: z.string(),
  memoryType: MemoryGeneration,
  memorySlots: z.number().int().positive(),
  maxMemoryGb: z.number().positive(),
  maxMemorySpeedMts: z.number().positive(),
  pcieGen: z.string(),
  m2Slots: z.number().int().nonnegative(),
  pcie5M2Slots: z.number().int().nonnegative().default(0),
  sataPorts: z.number().int().nonnegative(),
  usbPorts: z.number().int().nonnegative(),
  vrmVcorePhases: z.number().int().positive(),
  vrmPhaseCurrentA: z.number().positive(),
  lanGbps: z.number().positive(),
  wifiStandard: z.string().nullable().default(null),
  audioCodec: z.string(),
});
export type MotherboardSpecs = z.infer<typeof MotherboardSpecsSchema>;

/* ---------------------------------------------------------- Discriminated */

const BaseFields = {
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  series: z.string(),
  msrp: z.number().positive().nullable(),
  releaseDate: IsoDate.nullable(),
  /** Free-form editorial note surfaced on the detail page. */
  summary: z.string().default(""),
};

export const ComponentSchema = z.discriminatedUnion("category", [
  z.object({ ...BaseFields, category: z.literal("cpu"), specs: CpuSpecsSchema }),
  z.object({ ...BaseFields, category: z.literal("gpu"), specs: GpuSpecsSchema }),
  z.object({ ...BaseFields, category: z.literal("ram"), specs: RamSpecsSchema }),
  z.object({ ...BaseFields, category: z.literal("storage"), specs: StorageSpecsSchema }),
  z.object({
    ...BaseFields,
    category: z.literal("motherboard"),
    specs: MotherboardSpecsSchema,
  }),
]);

export type ComponentEntity = z.infer<typeof ComponentSchema>;
export type ComponentInput = z.input<typeof ComponentSchema>;

/** Narrowed entity types, useful when a view is category-specific. */
export type CpuEntity = Extract<ComponentEntity, { category: "cpu" }>;
export type GpuEntity = Extract<ComponentEntity, { category: "gpu" }>;
export type RamEntity = Extract<ComponentEntity, { category: "ram" }>;
export type StorageEntity = Extract<ComponentEntity, { category: "storage" }>;
export type MotherboardEntity = Extract<ComponentEntity, { category: "motherboard" }>;

export const ComponentListSchema = z.array(ComponentSchema);

/**
 * Parse a raw dataset chunk, failing loudly with the offending record's name.
 */
export function parseComponents(raw: unknown[]): ComponentEntity[] {
  return raw.map((record, index) => {
    const result = ComponentSchema.safeParse(record);
    if (!result.success) {
      const label =
        typeof record === "object" && record !== null && "slug" in record
          ? String((record as { slug: unknown }).slug)
          : `index ${index}`;
      throw new Error(
        `Invalid component record "${label}": ${JSON.stringify(result.error.issues, null, 2)}`,
      );
    }
    return result.data;
  });
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
