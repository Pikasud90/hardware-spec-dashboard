import {
  formatCacheMb,
  formatCapacityGb,
  formatCompact,
  formatInr,
  formatMhz,
  formatThroughputMbs,
  formatTrimmed,
  formatUsd,
} from "@/lib/format";
import { getPolarity, type MetricPolarity } from "@/lib/hardware-math";
import type { Category } from "@/lib/validations/component";

/**
 * The metric registry: one declarative description per comparable field.
 *
 * Every surface in the application is driven from this table — table columns,
 * the comparison matrix rows, heatmap axes, radar spokes, the correlation
 * matrix and the methodology page. Adding a metric here makes it appear
 * everywhere consistently; there is no second place to update.
 *
 * `analytic: true` marks a metric as safe for normalised cross-component
 * analysis (heatmap, radar, correlation). Identity-ish numbers and metrics
 * that are near-constant within a category are excluded so the visualisations
 * are not padded with noise.
 */

export type MetricGroup =
  | "Overview"
  | "Compute"
  | "Cache"
  | "Memory"
  | "Power"
  | "Physical"
  | "Endurance"
  | "Connectivity"
  | "Value"
  | "Modelled";

export const METRIC_GROUP_ORDER: MetricGroup[] = [
  "Overview",
  "Modelled",
  "Compute",
  "Cache",
  "Memory",
  "Endurance",
  "Power",
  "Connectivity",
  "Physical",
  "Value",
];

export interface MetricDef {
  key: string;
  label: string;
  /** Compact label for chart axes and dense table headers. */
  short: string;
  unit?: string;
  kind: "number" | "text" | "boolean";
  group: MetricGroup;
  decimals?: number;
  format?: (value: number) => string;
  /** True when the value is computed rather than read from a spec sheet. */
  derived?: boolean;
  /** Eligible for normalised analysis (heatmap, radar, correlation). */
  analytic?: boolean;
  /** Shown as a default column in the catalogue grid. */
  headline?: boolean;
  description: string;
  formula?: string;
}

export interface ResolvedMetric extends MetricDef {
  polarity: MetricPolarity;
}

/**
 * The headline price everywhere: a researched Indian street price in rupees.
 * Every cost and value ratio in the application is computed from this.
 */
const INR_PRICE: MetricDef = {
  key: "inrPrice",
  label: "Price (India)",
  short: "Price",
  kind: "number",
  group: "Value",
  format: (value) => formatInr(value),
  analytic: true,
  headline: true,
  description:
    "Street price from Indian retailers and price aggregators. Prices move constantly — check the confidence badge, and override any price in the build planner to match a quote you have been given.",
};

/** Launch MSRP in USD, kept only as generational context. */
const USD_MSRP: MetricDef = {
  key: "msrp",
  label: "Launch MSRP (USD)",
  short: "MSRP $",
  kind: "number",
  group: "Value",
  format: (value) => formatUsd(value),
  description:
    "Manufacturer recommended price at launch, in USD. Historical context only — it never feeds a value ratio, because a US launch price says nothing about what a part costs in India today.",
};

const RELEASE_YEAR: MetricDef = {
  key: "releaseYear",
  label: "Release year",
  short: "Year",
  kind: "number",
  group: "Overview",
  decimals: 0,
  format: (value) => String(Math.round(value)),
  description: "Calendar year of retail availability.",
};

/* ------------------------------------------------------------------- CPU */

const CPU_METRICS: MetricDef[] = [
  INR_PRICE,
  USD_MSRP,
  RELEASE_YEAR,
  {
    key: "socket",
    label: "Socket",
    short: "Socket",
    kind: "text",
    group: "Overview",
    headline: true,
    description: "Physical package interface, which determines motherboard compatibility.",
  },
  {
    key: "architecture",
    label: "Architecture",
    short: "Arch",
    kind: "text",
    group: "Overview",
    headline: true,
    description: "Core microarchitecture family, and the key that selects the IPC constant used by the performance model.",
  },
  {
    key: "codename",
    label: "Codename",
    short: "Codename",
    kind: "text",
    group: "Overview",
    description: "Vendor development codename for the silicon.",
  },
  {
    key: "processNodeNm",
    label: "Process node",
    short: "Node",
    unit: "nm",
    kind: "number",
    group: "Overview",
    decimals: 0,
    analytic: true,
    description:
      "Fabrication process. Smaller generally means better power efficiency, though vendor node names are marketing labels rather than physical measurements.",
  },
  {
    key: "totalCores",
    label: "Total cores",
    short: "Cores",
    kind: "number",
    group: "Compute",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Physical core count, summing performance and efficiency cores on hybrid designs.",
  },
  {
    key: "pCores",
    label: "Performance cores",
    short: "P-cores",
    kind: "number",
    group: "Compute",
    decimals: 0,
    description: "Full-width, high-clock cores. Equal to the total on non-hybrid designs.",
  },
  {
    key: "eCores",
    label: "Efficiency cores",
    short: "E-cores",
    kind: "number",
    group: "Compute",
    decimals: 0,
    description: "Smaller cores optimised for throughput per area and per watt rather than latency.",
  },
  {
    key: "threads",
    label: "Threads",
    short: "Threads",
    kind: "number",
    group: "Compute",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Simultaneously schedulable hardware threads. Exceeds core count only when SMT is enabled.",
  },
  {
    key: "baseClockGhz",
    label: "Base clock",
    short: "Base",
    unit: "GHz",
    kind: "number",
    group: "Compute",
    decimals: 1,
    analytic: true,
    description: "Guaranteed sustained frequency within the rated power envelope.",
  },
  {
    key: "boostClockGhz",
    label: "Boost clock",
    short: "Boost",
    unit: "GHz",
    kind: "number",
    group: "Compute",
    decimals: 1,
    analytic: true,
    headline: true,
    description: "Maximum opportunistic single-core frequency under favourable thermal conditions.",
  },
  {
    key: "l2CacheMb",
    label: "L2 cache",
    short: "L2",
    kind: "number",
    group: "Cache",
    format: formatCacheMb,
    description: "Per-core private cache, aggregated across all cores.",
  },
  {
    key: "l3CacheMb",
    label: "L3 cache",
    short: "L3",
    kind: "number",
    group: "Cache",
    format: formatCacheMb,
    analytic: true,
    headline: true,
    description:
      "Shared last-level cache. The dominant variable behind the gaming index, and what stacked-cache (X3D) parts multiply.",
  },
  {
    key: "totalCacheMb",
    label: "Total cache",
    short: "Cache",
    kind: "number",
    group: "Cache",
    format: formatCacheMb,
    derived: true,
    description: "L2 plus L3.",
    formula: "L2 + L3",
  },
  {
    key: "cachePerCoreMb",
    label: "Cache per core",
    short: "Cache/core",
    kind: "number",
    group: "Cache",
    decimals: 2,
    unit: "MB",
    derived: true,
    analytic: true,
    description: "Total cache divided by physical cores — a proxy for how much working set each core keeps local.",
    formula: "(L2 + L3) / cores",
  },
  {
    key: "tdpWatts",
    label: "TDP",
    short: "TDP",
    unit: "W",
    kind: "number",
    group: "Power",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Rated base power. Note that sustained turbo draw is governed by the higher PL2/PPT figure, not this one.",
  },
  {
    key: "pl2Watts",
    label: "Max turbo power",
    short: "PL2/PPT",
    unit: "W",
    kind: "number",
    group: "Power",
    decimals: 0,
    analytic: true,
    description:
      "Peak sustained package power (Intel PL2 / AMD PPT). This is the number that actually sizes a cooler and VRM.",
  },
  {
    key: "powerPerCoreW",
    label: "Power per core",
    short: "W/core",
    unit: "W",
    kind: "number",
    group: "Power",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "TDP divided by physical cores — an efficiency-density indicator.",
    formula: "TDP / cores",
  },
  {
    key: "singleThreadIndex",
    label: "Single-thread index",
    short: "ST index",
    kind: "number",
    group: "Modelled",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Modelled latency-sensitive performance, normalised so the best processor in this catalogue scores 100. Not a measured benchmark.",
    formula: "IPC(arch) x boost GHz, indexed to best",
  },
  {
    key: "multiThreadIndex",
    label: "Multi-thread index",
    short: "MT index",
    kind: "number",
    group: "Modelled",
    decimals: 1,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Modelled all-core throughput, accounting for SMT scaling and reduced E-core contribution. Normalised to 100. Not a measured benchmark.",
    formula: "IPC x boost x 0.92 x (P x (1 + 0.28 x SMT) + E x IPC_ratio x 0.78)",
  },
  {
    key: "gamingIndex",
    label: "Gaming index",
    short: "Game index",
    kind: "number",
    group: "Modelled",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Single-thread performance weighted by a logarithmic last-level-cache term, which is what elevates stacked-cache parts. Not a measured benchmark.",
    formula: "ST x (1 + 0.30 x ln(1 + L3 / 32))",
  },
  {
    key: "perfPerWatt",
    label: "Performance per watt",
    short: "Perf/W",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Multi-thread index divided by max turbo power, indexed to 100.",
    formula: "MT index / PL2, indexed to best",
  },
  {
    key: "perfPerRupee",
    label: "Performance per rupee",
    short: "Perf/₹",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Multi-thread index divided by Indian street price, indexed to 100.",
    formula: "MT index / ₹price, indexed to best",
  },
  {
    key: "costPerCore",
    label: "Cost per core",
    short: "$/core",
    kind: "number",
    group: "Value",
    format: (value) => formatInr(value),
    derived: true,
    analytic: true,
    description: "Indian street price divided by physical core count.",
    formula: "₹price / cores",
  },
  {
    key: "memoryType",
    label: "Memory type",
    short: "Mem type",
    kind: "text",
    group: "Memory",
    description: "Supported system memory generation.",
  },
  {
    key: "memoryChannels",
    label: "Memory channels",
    short: "Channels",
    kind: "number",
    group: "Memory",
    decimals: 0,
    description: "Independent memory channels on the integrated controller.",
  },
  {
    key: "maxMemorySpeedMts",
    label: "Max memory speed",
    short: "Mem speed",
    unit: "MT/s",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    description: "Officially validated memory transfer rate. Overclocked profiles routinely exceed it.",
  },
  {
    key: "systemMemoryBandwidthGbs",
    label: "Memory bandwidth",
    short: "Mem BW",
    unit: "GB/s",
    kind: "number",
    group: "Memory",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Theoretical peak bandwidth at officially supported memory speed.",
    formula: "(MT/s x 8 x channels) / 1000",
  },
  {
    key: "pcieVersion",
    label: "PCIe version",
    short: "PCIe",
    kind: "text",
    group: "Connectivity",
    description: "Highest PCI Express generation supported by the processor root complex.",
  },
  {
    key: "pcieLanes",
    label: "PCIe lanes",
    short: "Lanes",
    kind: "number",
    group: "Connectivity",
    decimals: 0,
    analytic: true,
    description: "Usable lanes provided directly by the processor, excluding chipset-attached lanes.",
  },
  {
    key: "integratedGraphics",
    label: "Integrated graphics",
    short: "iGPU",
    kind: "text",
    group: "Overview",
    description: "On-package display adapter, if any.",
  },
  {
    key: "unlocked",
    label: "Unlocked multiplier",
    short: "Unlocked",
    kind: "boolean",
    group: "Overview",
    description: "Whether the frequency multiplier can be raised for manual overclocking.",
  },
  {
    key: "stackedCache",
    label: "Stacked cache",
    short: "3D cache",
    kind: "boolean",
    group: "Cache",
    description: "Whether additional last-level cache is bonded vertically to the compute die.",
  },
  {
    key: "coolerIncluded",
    label: "Cooler included",
    short: "Cooler",
    kind: "boolean",
    group: "Overview",
    description: "Whether a boxed cooler ships with the retail package.",
  },
];

/* ------------------------------------------------------------------- GPU */

const GPU_METRICS: MetricDef[] = [
  INR_PRICE,
  USD_MSRP,
  RELEASE_YEAR,
  {
    key: "architecture",
    label: "Architecture",
    short: "Arch",
    kind: "text",
    group: "Overview",
    headline: true,
    description:
      "Graphics microarchitecture, and the key that selects the per-TFLOP efficiency constant used by the raster model.",
  },
  {
    key: "codename",
    label: "GPU die",
    short: "Die",
    kind: "text",
    group: "Overview",
    description: "Silicon die designation.",
  },
  {
    key: "processNodeNm",
    label: "Process node",
    short: "Node",
    unit: "nm",
    kind: "number",
    group: "Overview",
    decimals: 0,
    analytic: true,
    description: "Fabrication process used for the graphics die.",
  },
  {
    key: "cudaCoresOrShaders",
    label: "Shading units",
    short: "Shaders",
    kind: "number",
    group: "Compute",
    format: formatCompact,
    analytic: true,
    headline: true,
    description:
      "Vendor-reported shader ALU count. Not directly comparable across vendors — architectures with dual-issue or doubled FP32 datapaths advertise higher counts than games can use, which the model corrects for.",
  },
  {
    key: "rtCores",
    label: "Ray tracing cores",
    short: "RT cores",
    kind: "number",
    group: "Compute",
    decimals: 0,
    description: "Fixed-function ray-intersection units.",
  },
  {
    key: "tensorCores",
    label: "Matrix cores",
    short: "Tensor",
    kind: "number",
    group: "Compute",
    decimals: 0,
    description: "Matrix-multiply accelerators used for upscaling and inference workloads.",
  },
  {
    key: "baseClockMhz",
    label: "Base clock",
    short: "Base",
    kind: "number",
    group: "Compute",
    format: formatMhz,
    description: "Guaranteed sustained core frequency.",
  },
  {
    key: "boostClockMhz",
    label: "Boost clock",
    short: "Boost",
    kind: "number",
    group: "Compute",
    format: formatMhz,
    analytic: true,
    headline: true,
    description: "Reference boost frequency. Partner cards frequently ship above this.",
  },
  {
    key: "theoreticalTflops",
    label: "FP32 compute",
    short: "TFLOPS",
    unit: "TFLOPS",
    kind: "number",
    group: "Compute",
    decimals: 1,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Peak single-precision throughput. The factor of two counts a fused multiply-add as two operations.",
    formula: "(2 x shaders x boost MHz) / 1e6",
  },
  {
    key: "vramGb",
    label: "Memory capacity",
    short: "VRAM",
    kind: "number",
    group: "Memory",
    format: (value) => `${formatTrimmed(value)} GB`,
    analytic: true,
    headline: true,
    description: "Onboard framebuffer. The hard ceiling on texture and resolution settings.",
  },
  {
    key: "vramType",
    label: "Memory type",
    short: "Mem type",
    kind: "text",
    group: "Memory",
    description: "Memory technology generation, e.g. GDDR6 or GDDR7.",
  },
  {
    key: "busWidthBits",
    label: "Memory bus width",
    short: "Bus",
    unit: "bit",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    description: "Width of the memory interface. Combined with per-pin speed, this sets raw bandwidth.",
  },
  {
    key: "memorySpeedGbps",
    label: "Memory speed",
    short: "Mem speed",
    unit: "Gbps",
    kind: "number",
    group: "Memory",
    decimals: 1,
    description: "Per-pin memory data rate.",
  },
  {
    key: "memoryBandwidthGbs",
    label: "Memory bandwidth",
    short: "Bandwidth",
    unit: "GB/s",
    kind: "number",
    group: "Memory",
    decimals: 0,
    derived: true,
    analytic: true,
    headline: true,
    description: "Raw peak memory bandwidth, before any cache amplification.",
    formula: "(Gbps x bus width) / 8",
  },
  {
    key: "lastLevelCacheMb",
    label: "Last-level cache",
    short: "LLC",
    kind: "number",
    group: "Cache",
    format: formatCacheMb,
    analytic: true,
    description:
      "L2 on NVIDIA and Intel, Infinity Cache on AMD. Large caches let a narrow memory bus behave like a wider one.",
  },
  {
    key: "effectiveBandwidthGbs",
    label: "Effective bandwidth",
    short: "Eff. BW",
    unit: "GB/s",
    kind: "number",
    group: "Memory",
    decimals: 0,
    derived: true,
    analytic: true,
    description: "Raw bandwidth amplified by a saturating last-level-cache hit-rate term.",
    formula: "BW x (1 + 0.55 x LLC / (LLC + 64))",
  },
  {
    key: "bandwidthPerTflop",
    label: "Bandwidth per TFLOP",
    short: "BW/TFLOP",
    unit: "GB/s",
    kind: "number",
    group: "Memory",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Memory bandwidth available per unit of compute. Low values indicate a design leaning on cache, and predict weaker scaling at high resolutions.",
    formula: "bandwidth / TFLOPS",
  },
  {
    key: "rasterIndex",
    label: "Raster index",
    short: "Raster",
    kind: "number",
    group: "Modelled",
    decimals: 1,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Modelled rasterisation performance blending architecture-adjusted compute with effective bandwidth, normalised so the fastest card scores 100. Not a measured benchmark.",
    formula: "(TFLOPS x arch efficiency)^0.6 x effective bandwidth^0.4",
  },
  {
    key: "tgpWatts",
    label: "Board power",
    short: "TGP",
    unit: "W",
    kind: "number",
    group: "Power",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Total graphics power, which sizes both the power supply and the case airflow.",
  },
  {
    key: "perfPerWatt",
    label: "Performance per watt",
    short: "Perf/W",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Raster index divided by board power, indexed to 100.",
    formula: "raster index / TGP, indexed to best",
  },
  {
    key: "perfPerRupee",
    label: "Performance per rupee",
    short: "Perf/₹",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Raster index divided by Indian street price, indexed to 100.",
    formula: "raster index / ₹price, indexed to best",
  },
  {
    key: "costPerGb",
    label: "Cost per GB of VRAM",
    short: "$/GB",
    kind: "number",
    group: "Value",
    format: (value) => formatInr(value),
    derived: true,
    analytic: true,
    description: "Indian street price divided by memory capacity.",
    formula: "₹price / VRAM",
  },
  {
    key: "lengthMm",
    label: "Card length",
    short: "Length",
    unit: "mm",
    kind: "number",
    group: "Physical",
    decimals: 0,
    analytic: true,
    description: "Reference board length — the first thing to check against case clearance.",
  },
  {
    key: "slotWidth",
    label: "Slot width",
    short: "Slots",
    kind: "number",
    group: "Physical",
    decimals: 1,
    analytic: true,
    description: "Expansion slots occupied by the reference cooler.",
  },
  {
    key: "powerConnectors",
    label: "Power connectors",
    short: "Connectors",
    kind: "text",
    group: "Power",
    description: "Auxiliary power inputs required.",
  },
  {
    key: "pcieInterface",
    label: "PCIe interface",
    short: "Interface",
    kind: "text",
    group: "Connectivity",
    description:
      "Host interface generation and lane count. An x8 link can bottleneck a card on an older PCIe 3.0 platform.",
  },
];

/* ------------------------------------------------------------------- RAM */

const RAM_METRICS: MetricDef[] = [
  INR_PRICE,
  USD_MSRP,
  RELEASE_YEAR,
  {
    key: "generation",
    label: "Generation",
    short: "Gen",
    kind: "text",
    group: "Overview",
    headline: true,
    description: "DDR generation, which determines platform compatibility outright.",
  },
  {
    key: "capacityGb",
    label: "Total capacity",
    short: "Capacity",
    kind: "number",
    group: "Overview",
    format: formatCapacityGb,
    analytic: true,
    headline: true,
    description: "Combined capacity of every module in the kit.",
  },
  {
    key: "modules",
    label: "Module configuration",
    short: "Modules",
    kind: "text",
    group: "Overview",
    headline: true,
    description:
      "Count and size of individual DIMMs. Two modules generally clock higher than four on the same board.",
  },
  {
    key: "moduleCapacityGb",
    label: "Per-module capacity",
    short: "Per DIMM",
    kind: "number",
    group: "Overview",
    format: formatCapacityGb,
    analytic: true,
    description:
      "Capacity of a single DIMM. Larger modules are usually dual-rank, which improves bandwidth slightly but limits overclocking headroom.",
  },
  {
    key: "moduleCount",
    label: "Module count",
    short: "DIMMs",
    kind: "number",
    group: "Overview",
    decimals: 0,
    description: "Number of physical DIMMs, which affects achievable frequency and slot availability.",
  },
  {
    key: "speedMts",
    label: "Rated speed",
    short: "Speed",
    unit: "MT/s",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Advertised transfer rate at the rated overclocking profile.",
  },
  {
    key: "casLatency",
    label: "CAS latency",
    short: "CL",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    headline: true,
    description:
      "Column address strobe delay in clock cycles. Meaningless without the frequency it is measured against.",
  },
  {
    key: "trueLatencyNs",
    label: "True latency",
    short: "Latency",
    unit: "ns",
    kind: "number",
    group: "Memory",
    decimals: 2,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Absolute first-word latency in nanoseconds. This is the figure that makes kits at different speed grades genuinely comparable.",
    formula: "(2000 x CL) / MT/s",
  },
  {
    key: "timings",
    label: "Primary timings",
    short: "Timings",
    kind: "text",
    group: "Memory",
    description: "CL-tRCD-tRP-tRAS, the four primary timing parameters.",
  },
  {
    key: "memoryBandwidthDualGbs",
    label: "Dual-channel bandwidth",
    short: "Bandwidth",
    unit: "GB/s",
    kind: "number",
    group: "Memory",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Theoretical peak bandwidth in a two-channel configuration.",
    formula: "(MT/s x 8 x 2) / 1000",
  },
  {
    key: "ramEfficiencyScore",
    label: "Bandwidth-latency score",
    short: "BW/latency",
    kind: "number",
    group: "Modelled",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Bandwidth divided by true latency — one scalar capturing the trade-off memory-sensitive workloads actually experience.",
    formula: "dual-channel GB/s / true latency ns",
  },
  {
    key: "voltage",
    label: "Voltage",
    short: "VDD",
    unit: "V",
    kind: "number",
    group: "Power",
    decimals: 2,
    analytic: true,
    description: "Rated operating voltage. Higher voltage means more heat and, over time, more stress.",
  },
  {
    key: "heightMm",
    label: "Module height",
    short: "Height",
    unit: "mm",
    kind: "number",
    group: "Physical",
    decimals: 0,
    analytic: true,
    description: "Overall DIMM height — the usual source of conflict with large air coolers.",
  },
  {
    key: "profileSupport",
    label: "Overclocking profile",
    short: "Profile",
    kind: "text",
    group: "Overview",
    description: "XMP or EXPO profile support. EXPO profiles are tuned for AMD platforms.",
  },
  {
    key: "costPerGb",
    label: "Cost per GB",
    short: "$/GB",
    kind: "number",
    group: "Value",
    format: (value) => formatInr(value),
    derived: true,
    analytic: true,
    description: "Indian street price divided by total capacity.",
    formula: "₹price / capacity",
  },
  {
    key: "perfPerRupee",
    label: "Value index",
    short: "Value",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Bandwidth-latency score per rupee, indexed to 100.",
    formula: "BW-latency score / ₹price, indexed to best",
  },
  { key: "ecc", label: "ECC", short: "ECC", kind: "boolean", group: "Overview", description: "On-die error correction support." },
  { key: "rgb", label: "RGB lighting", short: "RGB", kind: "boolean", group: "Physical", description: "Addressable lighting on the heatspreader." },
];

/* --------------------------------------------------------------- Storage */

const STORAGE_METRICS: MetricDef[] = [
  INR_PRICE,
  USD_MSRP,
  RELEASE_YEAR,
  {
    key: "capacityGb",
    label: "Capacity",
    short: "Capacity",
    kind: "number",
    group: "Overview",
    format: formatCapacityGb,
    analytic: true,
    headline: true,
    description: "Usable capacity as marketed.",
  },
  {
    key: "interface",
    label: "Interface",
    short: "Interface",
    kind: "text",
    group: "Connectivity",
    headline: true,
    description: "Host interface generation and lane count, which sets the theoretical throughput ceiling.",
  },
  {
    key: "formFactor",
    label: "Form factor",
    short: "Form",
    kind: "text",
    group: "Physical",
    description: "Physical format, typically M.2 2280 or 2.5 inch.",
  },
  {
    key: "nandType",
    label: "NAND type",
    short: "NAND",
    kind: "text",
    group: "Overview",
    headline: true,
    description:
      "Cells per flash cell. TLC stores three bits, QLC four — QLC is cheaper per gigabyte but slower and far less durable.",
  },
  {
    key: "controller",
    label: "Controller",
    short: "Controller",
    kind: "text",
    group: "Overview",
    description: "Flash controller, which largely determines sustained performance and power draw.",
  },
  {
    key: "dramCacheMb",
    label: "DRAM cache",
    short: "DRAM",
    kind: "number",
    group: "Cache",
    format: formatCacheMb,
    analytic: true,
    description:
      "Onboard DRAM for the flash translation layer. DRAM-less drives borrow host memory instead, which hurts sustained random performance.",
  },
  {
    key: "seqReadMb",
    label: "Sequential read",
    short: "Seq read",
    kind: "number",
    group: "Compute",
    format: formatThroughputMbs,
    analytic: true,
    headline: true,
    description: "Peak sequential read throughput.",
  },
  {
    key: "seqWriteMb",
    label: "Sequential write",
    short: "Seq write",
    kind: "number",
    group: "Compute",
    format: formatThroughputMbs,
    analytic: true,
    headline: true,
    description: "Peak sequential write throughput, typically measured inside the SLC cache.",
  },
  {
    key: "randomReadIops",
    label: "Random read",
    short: "Rand read",
    unit: "IOPS",
    kind: "number",
    group: "Compute",
    format: formatCompact,
    analytic: true,
    description: "4K random read operations per second — far more representative of everyday responsiveness than sequential figures.",
  },
  {
    key: "randomWriteIops",
    label: "Random write",
    short: "Rand write",
    unit: "IOPS",
    kind: "number",
    group: "Compute",
    format: formatCompact,
    analytic: true,
    description: "4K random write operations per second.",
  },
  {
    key: "interfaceUtilisationPct",
    label: "Interface utilisation",
    short: "Link use",
    unit: "%",
    kind: "number",
    group: "Connectivity",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Share of the host link the drive's sequential read consumes. Near 100% means it is interface-bound and would gain from a faster slot; well below means the NAND is the limit.",
    formula: "seq read / interface ceiling x 100",
  },
  {
    key: "tbw",
    label: "Endurance (TBW)",
    short: "TBW",
    unit: "TB",
    kind: "number",
    group: "Endurance",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Total terabytes that may be written within warranty.",
  },
  {
    key: "dwpd",
    label: "Drive writes per day",
    short: "DWPD",
    kind: "number",
    group: "Endurance",
    decimals: 2,
    derived: true,
    analytic: true,
    description:
      "How many times the whole drive could be overwritten daily across the warranty. Normalises endurance across capacities and warranty lengths.",
    formula: "(TBW x 1000) / (capacity x 365 x warranty years)",
  },
  {
    key: "warrantyYears",
    label: "Warranty",
    short: "Warranty",
    unit: "yr",
    kind: "number",
    group: "Endurance",
    decimals: 0,
    analytic: true,
    description: "Limited warranty period.",
  },
  {
    key: "costPerTb",
    label: "Cost per TB",
    short: "$/TB",
    kind: "number",
    group: "Value",
    format: (value) => formatInr(value),
    derived: true,
    analytic: true,
    headline: true,
    description: "The standard basis for comparing drives of different capacities.",
    formula: "₹price / (capacity / 1000)",
  },
  {
    key: "costPerGb",
    label: "Cost per GB",
    short: "$/GB",
    kind: "number",
    group: "Value",
    format: (value) => formatInr(value, 2),
    derived: true,
    analytic: true,
    description: "Indian street price divided by capacity in gigabytes.",
    formula: "₹price / capacity",
  },
  {
    key: "perfPerRupee",
    label: "Throughput per rupee",
    short: "MB/s per ₹",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description: "Sequential read throughput per rupee, indexed to 100.",
    formula: "seq read / ₹price, indexed to best",
  },
  { key: "heatsink", label: "Heatsink included", short: "Heatsink", kind: "boolean", group: "Physical", description: "Whether a heatsink ships with the drive." },
];

/* ----------------------------------------------------------- Motherboard */

const MOTHERBOARD_METRICS: MetricDef[] = [
  INR_PRICE,
  USD_MSRP,
  RELEASE_YEAR,
  {
    key: "socket",
    label: "Socket",
    short: "Socket",
    kind: "text",
    group: "Overview",
    headline: true,
    description: "Processor socket, which fixes CPU compatibility absolutely.",
  },
  {
    key: "chipset",
    label: "Chipset",
    short: "Chipset",
    kind: "text",
    group: "Overview",
    headline: true,
    description: "Platform controller hub, which governs lane allocation and overclocking support.",
  },
  {
    key: "formFactor",
    label: "Form factor",
    short: "Form",
    kind: "text",
    group: "Physical",
    headline: true,
    description: "Board size standard, which must match the case.",
  },
  {
    key: "memoryType",
    label: "Memory type",
    short: "Mem type",
    kind: "text",
    group: "Memory",
    headline: true,
    description: "DDR generation supported. A board supports one or the other, never both.",
  },
  {
    key: "memorySlots",
    label: "Memory slots",
    short: "Slots",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    description: "DIMM slots. Two-slot boards typically reach higher stable memory frequencies than four-slot boards.",
  },
  {
    key: "maxMemoryGb",
    label: "Max memory",
    short: "Max RAM",
    kind: "number",
    group: "Memory",
    format: formatCapacityGb,
    analytic: true,
    description: "Maximum supported memory capacity.",
  },
  {
    key: "maxMemorySpeedMts",
    label: "Max memory speed",
    short: "Mem OC",
    unit: "MT/s",
    kind: "number",
    group: "Memory",
    decimals: 0,
    analytic: true,
    description: "Highest validated overclocked memory profile.",
  },
  {
    key: "pcieGen",
    label: "PCIe generation",
    short: "PCIe",
    kind: "text",
    group: "Connectivity",
    description: "Highest PCI Express generation on the primary graphics slot.",
  },
  {
    key: "m2Slots",
    label: "M.2 slots",
    short: "M.2",
    kind: "number",
    group: "Connectivity",
    decimals: 0,
    analytic: true,
    headline: true,
    description: "Total onboard M.2 NVMe slots.",
  },
  {
    key: "pcie5M2Slots",
    label: "PCIe 5.0 M.2 slots",
    short: "M.2 Gen5",
    kind: "number",
    group: "Connectivity",
    decimals: 0,
    analytic: true,
    description: "M.2 slots wired for PCIe 5.0, required to reach full speed on Gen5 drives.",
  },
  {
    key: "sataPorts",
    label: "SATA ports",
    short: "SATA",
    kind: "number",
    group: "Connectivity",
    decimals: 0,
    analytic: true,
    description: "SATA III ports, which often share bandwidth with M.2 slots.",
  },
  {
    key: "usbPorts",
    label: "Rear USB ports",
    short: "USB",
    kind: "number",
    group: "Connectivity",
    decimals: 0,
    analytic: true,
    description: "USB ports on the rear I/O panel.",
  },
  {
    key: "vrmVcorePhases",
    label: "Vcore phases",
    short: "Phases",
    kind: "number",
    group: "Power",
    decimals: 0,
    analytic: true,
    description: "Power stages dedicated to processor core voltage.",
  },
  {
    key: "vrmPhaseCurrentA",
    label: "Current per phase",
    short: "A/phase",
    unit: "A",
    kind: "number",
    group: "Power",
    decimals: 0,
    analytic: true,
    description: "Rated current of each power stage.",
  },
  {
    key: "vrmTotalCurrentA",
    label: "Total Vcore current",
    short: "Total A",
    unit: "A",
    kind: "number",
    group: "Power",
    decimals: 0,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Phases multiplied by per-phase current. This, not the marketing phase count, is what determines whether a board can sustain a 250 W processor.",
    formula: "phases x amps per phase",
  },
  {
    key: "lanGbps",
    label: "Wired network",
    short: "LAN",
    unit: "Gbps",
    kind: "number",
    group: "Connectivity",
    decimals: 1,
    analytic: true,
    description: "Onboard Ethernet controller speed.",
  },
  {
    key: "wifiStandard",
    label: "Wireless",
    short: "Wi-Fi",
    kind: "text",
    group: "Connectivity",
    description: "Onboard wireless standard, if fitted.",
  },
  {
    key: "audioCodec",
    label: "Audio codec",
    short: "Audio",
    kind: "text",
    group: "Connectivity",
    description: "Integrated audio codec.",
  },
  {
    key: "perfPerRupee",
    label: "Expansion per rupee",
    short: "Expansion/₹",
    kind: "number",
    group: "Value",
    decimals: 1,
    derived: true,
    analytic: true,
    description:
      "Expansion score per rupee, indexed to 100. Surfaces the boards that give away the least connectivity for the money.",
    formula: "expansion score / ₹price, indexed to best",
  },
  {
    key: "expansionScore",
    label: "Expansion score",
    short: "Expansion",
    kind: "number",
    group: "Modelled",
    decimals: 0,
    derived: true,
    analytic: true,
    headline: true,
    description:
      "Composite connectivity score weighted toward what actually constrains builds: M.2 slots first, then Gen5 slots, SATA, USB, networking and DIMM slots.",
    formula: "10xM.2 + 6xGen5 M.2 + 2xSATA + 1.2xUSB + 3xmin(LAN,10) + 8xWi-Fi + 2xDIMM",
  },
];

/* ----------------------------------------------------------- public API */

const REGISTRY: Record<Category, MetricDef[]> = {
  cpu: CPU_METRICS,
  gpu: GPU_METRICS,
  ram: RAM_METRICS,
  storage: STORAGE_METRICS,
  motherboard: MOTHERBOARD_METRICS,
};

function withPolarity(definition: MetricDef): ResolvedMetric {
  return { ...definition, polarity: getPolarity(definition.key) };
}

/** Every metric defined for a category, in registry order. */
export function metricsFor(category: Category): ResolvedMetric[] {
  return REGISTRY[category].map(withPolarity);
}

const LOOKUP: Record<Category, Map<string, ResolvedMetric>> = Object.fromEntries(
  (Object.keys(REGISTRY) as Category[]).map((category) => [
    category,
    new Map(metricsFor(category).map((metric) => [metric.key, metric])),
  ]),
) as Record<Category, Map<string, ResolvedMetric>>;

export function metricFor(category: Category, key: string): ResolvedMetric | undefined {
  return LOOKUP[category].get(key);
}

/** Numeric metrics eligible for normalised cross-component analysis. */
export function analyticMetricsFor(category: Category): ResolvedMetric[] {
  return metricsFor(category).filter(
    (metric) => metric.analytic === true && metric.kind === "number",
  );
}

/** Metrics shown as default columns in the catalogue grid. */
export function headlineMetricsFor(category: Category): ResolvedMetric[] {
  return metricsFor(category).filter((metric) => metric.headline === true);
}

/** Metrics grouped by section, in canonical group order, for the spec sheet. */
export function groupedMetricsFor(
  category: Category,
): Array<{ group: MetricGroup; metrics: ResolvedMetric[] }> {
  const metrics = metricsFor(category);
  return METRIC_GROUP_ORDER.map((group) => ({
    group,
    metrics: metrics.filter((metric) => metric.group === group),
  })).filter((section) => section.metrics.length > 0);
}

/** Every derived metric across all categories, for the methodology page. */
export function allDerivedMetrics(): Array<{ category: Category; metric: ResolvedMetric }> {
  return (Object.keys(REGISTRY) as Category[]).flatMap((category) =>
    metricsFor(category)
      .filter((metric) => metric.derived === true)
      .map((metric) => ({ category, metric })),
  );
}

/**
 * Render a metric value for display, including the missing-value case.
 * This is the only place `EMPTY_VALUE` is decided, so a blank cell in the
 * comparison grid and a blank row on the spec sheet always agree (US3).
 */
export function formatMetricValue(
  metric: ResolvedMetric,
  value: number | string | boolean | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";

  if (metric.kind === "boolean") return value ? "Yes" : "No";
  if (metric.kind === "text") return String(value);

  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (metric.format) return metric.format(value);

  const rendered = formatTrimmed(value, metric.decimals ?? 2);
  return metric.unit ? `${rendered} ${metric.unit}` : rendered;
}
