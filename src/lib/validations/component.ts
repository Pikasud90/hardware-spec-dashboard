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

export const CATEGORIES = ["cpu", "gpu", "ram", "storage", "motherboard", "psu"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cpu: "Processors",
  gpu: "Graphics Cards",
  ram: "Memory",
  storage: "Storage",
  motherboard: "Motherboards",
  psu: "Power Supplies",
};

export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "SSD",
  motherboard: "Mobo",
  psu: "PSU",
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

/* --------------------------------------------------------------- PSU/SMPS */

export const PsuSpecsSchema = z.object({
  wattage: z.number().positive(),
  /** 80 PLUS tier. Determines heat, noise and running cost, not capability. */
  efficiencyRating: z.enum([
    "80+ White",
    "80+ Bronze",
    "80+ Silver",
    "80+ Gold",
    "80+ Platinum",
    "80+ Titanium",
  ]),
  modularity: z.enum(["Non-modular", "Semi-modular", "Fully modular"]),
  formFactor: z.enum(["ATX", "SFX", "SFX-L"]),
  /** Sustained current on the 12V rail — the rail everything demanding uses. */
  rail12vAmps: z.number().positive(),
  /** 8-pin (6+2) PCIe connectors for graphics cards. */
  pcie8PinConnectors: z.number().int().nonnegative(),
  /** 12V-2x6 / 12VHPWR connectors, required natively by recent NVIDIA cards. */
  pcie12vhpwrConnectors: z.number().int().nonnegative().default(0),
  /** EPS 8-pin connectors for CPU power. High-end boards want two. */
  eps8PinConnectors: z.number().int().positive(),
  sataConnectors: z.number().int().nonnegative(),
  /**
   * ATX 3.x compliance. Matters because modern GPUs draw very short power
   * spikes far above their rated board power; a compliant unit is specified to
   * ride them out instead of tripping protection.
   */
  atx3Compliant: z.boolean().default(false),
  fanSizeMm: z.number().positive(),
  lengthMm: z.number().positive(),
  warrantyYears: z.number().positive(),
});
export type PsuSpecs = z.infer<typeof PsuSpecsSchema>;

/* ---------------------------------------------------------- Discriminated */

/**
 * How much to trust an Indian street price.
 *
 *  high    — a current listing was found on an Indian retailer or aggregator
 *  medium  — found, but observed listings disagree materially
 *  low     — the category is repricing fast (DDR5 through the 2026 DRAM
 *            shortage), or the part is scarce enough that listings are thin
 */
export const PriceConfidence = z.enum(["high", "medium", "low"]);
export type PriceConfidenceLevel = z.infer<typeof PriceConfidence>;

/** Whether the part can still be bought new in India. */
export const Availability = z.enum(["available", "limited", "discontinued"]);
export type AvailabilityLevel = z.infer<typeof Availability>;

const BaseFields = {
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  series: z.string(),
  /** Launch recommended price in USD. Historical reference only. */
  msrp: z.number().positive().nullable(),
  /**
   * Researched Indian street price in rupees. This is the figure the whole
   * application costs against; `msrp` is kept only for generational context.
   * Null when the part is no longer sold new in India.
   */
  inrPrice: z.number().positive().nullable().default(null),
  priceConfidence: PriceConfidence.default("medium"),
  availability: Availability.default("available"),
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
  z.object({ ...BaseFields, category: z.literal("psu"), specs: PsuSpecsSchema }),
]);

export type ComponentEntity = z.infer<typeof ComponentSchema>;
export type ComponentInput = z.input<typeof ComponentSchema>;

/** Narrowed entity types, useful when a view is category-specific. */
export type CpuEntity = Extract<ComponentEntity, { category: "cpu" }>;
export type GpuEntity = Extract<ComponentEntity, { category: "gpu" }>;
export type RamEntity = Extract<ComponentEntity, { category: "ram" }>;
export type StorageEntity = Extract<ComponentEntity, { category: "storage" }>;
export type MotherboardEntity = Extract<ComponentEntity, { category: "motherboard" }>;
export type PsuEntity = Extract<ComponentEntity, { category: "psu" }>;

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
