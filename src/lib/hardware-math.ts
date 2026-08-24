import type {
  ComponentEntity,
  CpuSpecs,
  GpuSpecs,
  MotherboardSpecs,
  RamSpecs,
  StorageSpecs,
} from "@/lib/validations/component";

/**
 * Derived-metric engine.
 *
 * Two distinct classes of number live here:
 *
 *  1. **Exact identities** — TFLOPS, memory bandwidth, true latency, cost per
 *     terabyte. These are arithmetic restatements of published specifications
 *     and are correct by construction.
 *
 *  2. **Modelled indices** — the CPU/GPU performance scores. These are NOT
 *     measured benchmark results. They are transparent functions of published
 *     specifications, calibrated with per-architecture constants declared below
 *     so the reasoning is auditable. Expect roughly +/-15% deviation from real
 *     measured suites, and see `/methodology` for the full derivation.
 *
 * Every function returns `null` rather than `NaN` or `Infinity` when an input
 * is missing or would divide by zero (US10).
 */

/* ------------------------------------------------------------- primitives */

/** Guard: finite, non-null, and strictly positive. */
function positive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** Guard: finite and non-null (zero permitted). */
function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Division that yields `null` instead of `Infinity`/`NaN`. */
export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | null {
  if (!finite(numerator) || !positive(denominator)) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

/** Round to `digits` decimal places, preserving `null`. */
export function round(value: number | null, digits = 2): number | null {
  if (!finite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/* ------------------------------------------------- exact derived formulas */

/**
 * True (absolute) memory latency in nanoseconds.
 *
 *   t = (CL / (MT/s / 2)) x 1000 = (2000 x CL) / MT/s
 *
 * Because DDR transfers on both clock edges, the actual bus clock is half the
 * advertised MT/s figure — which is why a DDR5-6000 CL30 kit (10.0 ns) beats a
 * DDR5-6400 CL36 kit (11.25 ns) despite the lower headline number.
 */
export function calcTrueRamLatency(speedMts: number, cl: number): number | null {
  if (!positive(speedMts) || !positive(cl)) return null;
  return (2000 * cl) / speedMts;
}

/**
 * Theoretical FP32 throughput in TFLOPS.
 *
 *   TFLOPS = (2 x shaders x clock_MHz) / 1e6
 *
 * The factor of two is the fused multiply-add counting as two operations.
 */
export function calcGpuTflops(shaders: number, boostMhz: number): number | null {
  if (!positive(shaders) || !positive(boostMhz)) return null;
  return (2 * shaders * boostMhz) / 1_000_000;
}

/**
 * GPU memory bandwidth in GB/s.
 *
 *   GB/s = (Gbps_per_pin x bus_width_bits) / 8
 */
export function calcGpuBandwidth(speedGbps: number, busWidthBits: number): number | null {
  if (!positive(speedGbps) || !positive(busWidthBits)) return null;
  return (speedGbps * busWidthBits) / 8;
}

/**
 * System memory bandwidth in GB/s.
 *
 *   GB/s = (MT/s x 8 bytes x channels) / 1000
 */
export function calcSystemMemoryBandwidth(
  speedMts: number,
  channels: number,
): number | null {
  if (!positive(speedMts) || !positive(channels)) return null;
  return (speedMts * 8 * channels) / 1000;
}

/** Theoretical unidirectional ceiling of a host interface, in MB/s. */
export const INTERFACE_CEILING_MBS: Record<string, number> = {
  "PCIe 5.0 x4": 15754,
  "PCIe 5.0 x2": 7877,
  "PCIe 4.0 x4": 7877,
  "PCIe 4.0 x2": 3938,
  "PCIe 3.0 x4": 3938,
  "PCIe 3.0 x2": 1969,
  "SATA III": 600,
};

/**
 * How much of the host interface a drive's sequential read actually consumes.
 * A high number means the drive is interface-bound and would benefit from a
 * faster slot; a low number means the NAND/controller is the limit.
 */
export function calcInterfaceUtilisation(
  seqReadMb: number,
  interfaceName: string,
): number | null {
  const ceiling = INTERFACE_CEILING_MBS[interfaceName];
  if (!positive(seqReadMb) || !positive(ceiling)) return null;
  return Math.min(100, (seqReadMb / ceiling) * 100);
}

/**
 * Drive writes per day sustainable across the warranty period.
 *
 *   DWPD = (TBW x 1000) / (capacity_GB x 365 x warranty_years)
 */
export function calcDwpd(
  tbw: number,
  capacityGb: number,
  warrantyYears: number,
): number | null {
  if (!positive(tbw) || !positive(capacityGb) || !positive(warrantyYears)) return null;
  return (tbw * 1000) / (capacityGb * 365 * warrantyYears);
}

/* -------------------------------------------- modelling constants: CPU */

/**
 * Relative per-clock throughput of each core architecture, normalised so that
 * Zen 4 P-cores = 1.00. Hybrid designs list both core types.
 *
 * These constants are the single place where subjective calibration enters the
 * CPU model; changing a value here changes every downstream score coherently.
 */
export const CPU_ARCHITECTURE_IPC: Record<string, { pCore: number; eCore: number }> = {
  "Zen 2": { pCore: 0.8, eCore: 0 },
  "Zen 3": { pCore: 0.9, eCore: 0 },
  "Zen 4": { pCore: 1.0, eCore: 0 },
  "Zen 5": { pCore: 1.11, eCore: 0 },
  "Comet Lake": { pCore: 0.72, eCore: 0 },
  "Rocket Lake": { pCore: 0.83, eCore: 0 },
  "Alder Lake": { pCore: 0.96, eCore: 0.62 },
  "Raptor Lake": { pCore: 0.99, eCore: 0.64 },
  "Arrow Lake": { pCore: 1.09, eCore: 0.8 },
};

/** Throughput uplift contributed by a second thread on an SMT-capable core. */
export const SMT_SCALING_GAIN = 0.28;
/** Sustained all-core clock as a fraction of single-core boost. */
export const ALL_CORE_CLOCK_RATIO = 0.92;
/** E-core clock as a fraction of P-core boost on hybrid parts. */
export const E_CORE_CLOCK_RATIO = 0.78;
/** Weight of the logarithmic last-level-cache term in the gaming model. */
export const CACHE_GAMING_WEIGHT = 0.3;
/** Cache size, in MB, at which the gaming cache term is neutral. */
export const CACHE_REFERENCE_MB = 32;

function cpuIpc(specs: CpuSpecs): { pCore: number; eCore: number } {
  return CPU_ARCHITECTURE_IPC[specs.architecture] ?? { pCore: 0.85, eCore: 0.55 };
}

/**
 * Single-thread index (unnormalised).
 *
 *   ST = IPC_pcore x boost_GHz
 */
export function calcCpuSingleThreadRaw(specs: CpuSpecs): number | null {
  const ipc = cpuIpc(specs).pCore;
  if (!positive(ipc) || !positive(specs.boostClockGhz)) return null;
  return ipc * specs.boostClockGhz;
}

/**
 * Multi-thread index (unnormalised).
 *
 *   effective_cores = P x (1 + SMT_GAIN x smt_active)
 *                   + E x (IPC_ecore / IPC_pcore) x E_CLOCK_RATIO
 *   MT = IPC_pcore x boost_GHz x ALL_CORE_RATIO x effective_cores
 *
 * `smt_active` is inferred from the thread count exceeding the core count,
 * so a part with SMT fused off scores as the physical cores alone.
 */
export function calcCpuMultiThreadRaw(specs: CpuSpecs): number | null {
  const { pCore, eCore } = cpuIpc(specs);
  if (!positive(pCore) || !positive(specs.boostClockGhz)) return null;

  const physicalP = specs.pCores > 0 ? specs.pCores : specs.totalCores;
  const physicalE = specs.eCores;
  const smtActive = specs.threads > specs.totalCores ? 1 : 0;

  const ratio = pCore > 0 ? eCore / pCore : 0;
  const effectiveCores =
    physicalP * (1 + SMT_SCALING_GAIN * smtActive) +
    physicalE * ratio * E_CORE_CLOCK_RATIO;

  if (!positive(effectiveCores)) return null;
  return pCore * specs.boostClockGhz * ALL_CORE_CLOCK_RATIO * effectiveCores;
}

/**
 * Gaming index (unnormalised).
 *
 *   GAME = ST x (1 + W x ln(1 + L3_total / L3_ref))
 *
 * The logarithm encodes diminishing returns: the jump from 32 MB to 96 MB of
 * L3 matters far more than 96 MB to 192 MB. This is what surfaces the
 * stacked-cache parts (X3D) above their higher-clocked siblings.
 */
export function calcCpuGamingRaw(specs: CpuSpecs): number | null {
  const st = calcCpuSingleThreadRaw(specs);
  if (!positive(st)) return null;
  const cacheTerm =
    1 + CACHE_GAMING_WEIGHT * Math.log(1 + specs.l3CacheMb / CACHE_REFERENCE_MB);
  return st * cacheTerm;
}

/* -------------------------------------------- modelling constants: GPU */

/**
 * Realised gaming throughput per nominal TFLOP, relative to Ada Lovelace = 1.00.
 *
 * Vendors count shader ALUs differently — architectures with dual-issue or
 * doubled FP32 datapaths (Ampere, RDNA 3) advertise TFLOPS that games cannot
 * fully consume, so their factor is adjusted to keep cross-vendor comparison
 * meaningful rather than flattering to whoever counts most generously.
 */
export const GPU_ARCHITECTURE_EFFICIENCY: Record<string, number> = {
  Turing: 0.9,
  Ampere: 0.78,
  "Ada Lovelace": 1.0,
  Blackwell: 1.06,
  "RDNA 2": 1.42,
  "RDNA 3": 1.45,
  "RDNA 4": 1.6,
  "Xe-HPG": 0.72,
  Xe2: 0.98,
};

/** Compute exponent in the Cobb-Douglas raster blend. */
export const GPU_COMPUTE_EXPONENT = 0.6;
/** Bandwidth exponent in the Cobb-Douglas raster blend. */
export const GPU_BANDWIDTH_EXPONENT = 0.4;
/** Saturation constant (MB) for the last-level-cache bandwidth amplifier. */
export const GPU_CACHE_HALF_SATURATION_MB = 64;
/** Maximum effective-bandwidth multiplier a large last-level cache can add. */
export const GPU_CACHE_MAX_UPLIFT = 0.55;

/**
 * Effective memory bandwidth, amplifying raw bandwidth by the hit rate a large
 * last-level cache provides:
 *
 *   BW_eff = BW_raw x (1 + UPLIFT_max x LLC / (LLC + HALF_SAT))
 */
export function calcGpuEffectiveBandwidth(specs: GpuSpecs): number | null {
  const raw = calcGpuBandwidth(specs.memorySpeedGbps, specs.busWidthBits);
  if (!positive(raw)) return null;
  const llc = specs.lastLevelCacheMb ?? 0;
  const uplift =
    1 + GPU_CACHE_MAX_UPLIFT * (llc / (llc + GPU_CACHE_HALF_SATURATION_MB));
  return raw * uplift;
}

/**
 * Raster index (unnormalised).
 *
 *   RASTER = (TFLOPS x arch_efficiency)^0.6 x BW_eff^0.4
 *
 * A Cobb-Douglas form rather than a sum, because a GPU starved of either
 * compute or bandwidth is limited by the scarcer one; the exponents encode how
 * much each contributes at the margin.
 */
export function calcGpuRasterRaw(specs: GpuSpecs): number | null {
  const tflops = calcGpuTflops(specs.cudaCoresOrShaders, specs.boostClockMhz);
  const bandwidth = calcGpuEffectiveBandwidth(specs);
  if (!positive(tflops) || !positive(bandwidth)) return null;
  const efficiency = GPU_ARCHITECTURE_EFFICIENCY[specs.architecture] ?? 1.0;
  return (
    Math.pow(tflops * efficiency, GPU_COMPUTE_EXPONENT) *
    Math.pow(bandwidth, GPU_BANDWIDTH_EXPONENT)
  );
}

/**
 * Bytes of memory bandwidth available per nominal TFLOP.
 * Low values flag an architecture that leans on cache rather than raw
 * bandwidth, and predicts weaker scaling at high resolutions.
 */
export function calcGpuBandwidthPerTflop(specs: GpuSpecs): number | null {
  const tflops = calcGpuTflops(specs.cudaCoresOrShaders, specs.boostClockMhz);
  const bandwidth = calcGpuBandwidth(specs.memorySpeedGbps, specs.busWidthBits);
  return safeDivide(bandwidth, tflops);
}

/* ------------------------------------------------------- RAM / mobo aids */

/**
 * A single scalar trading bandwidth against latency:
 *
 *   SCORE = peak_dual_channel_GB/s / true_latency_ns
 *
 * It is the quantity that actually moves memory-sensitive workloads, and it
 * correctly ranks a tight DDR5-6000 CL30 kit above a loose DDR5-7200 CL40 one.
 */
export function calcRamEfficiencyScore(specs: RamSpecs): number | null {
  const bandwidth = calcSystemMemoryBandwidth(specs.speedMts, 2);
  const latency = calcTrueRamLatency(specs.speedMts, specs.casLatency);
  return safeDivide(bandwidth, latency);
}

/** Total sustained Vcore delivery capability, in amps. */
export function calcVrmTotalCurrent(specs: MotherboardSpecs): number | null {
  if (!positive(specs.vrmVcorePhases) || !positive(specs.vrmPhaseCurrentA)) return null;
  return specs.vrmVcorePhases * specs.vrmPhaseCurrentA;
}

/**
 * Composite expansion capability, weighted by what actually constrains builds:
 * M.2 slots (heavily), PCIe 5.0 M.2 slots, SATA ports, USB ports, and network.
 */
export function calcMotherboardExpansionScore(specs: MotherboardSpecs): number | null {
  const score =
    specs.m2Slots * 10 +
    specs.pcie5M2Slots * 6 +
    specs.sataPorts * 2 +
    specs.usbPorts * 1.2 +
    Math.min(specs.lanGbps, 10) * 3 +
    (specs.wifiStandard ? 8 : 0) +
    specs.memorySlots * 2;
  return Number.isFinite(score) ? score : null;
}

/* ------------------------------------------------------ polarity handling */

export type MetricPolarity = "HIGHER_BETTER" | "LOWER_BETTER" | "NEUTRAL";

/**
 * Direction of "better" for every numeric metric key in the application.
 *
 * Keeping this as one flat map (rather than a flag on each column definition)
 * means the comparison grid, the heatmap, the radar chart and the ranking
 * tables cannot disagree about which end of a scale is good.
 */
export const METRIC_POLARITY_MAP: Record<string, MetricPolarity> = {
  /* shared */
  msrp: "LOWER_BETTER",
  releaseYear: "HIGHER_BETTER",
  processNodeNm: "LOWER_BETTER",

  /* cpu */
  totalCores: "HIGHER_BETTER",
  pCores: "HIGHER_BETTER",
  eCores: "HIGHER_BETTER",
  threads: "HIGHER_BETTER",
  baseClockGhz: "HIGHER_BETTER",
  boostClockGhz: "HIGHER_BETTER",
  l2CacheMb: "HIGHER_BETTER",
  l3CacheMb: "HIGHER_BETTER",
  totalCacheMb: "HIGHER_BETTER",
  cachePerCoreMb: "HIGHER_BETTER",
  tdpWatts: "LOWER_BETTER",
  pl2Watts: "LOWER_BETTER",
  powerPerCoreW: "LOWER_BETTER",
  pcieLanes: "HIGHER_BETTER",
  memoryChannels: "HIGHER_BETTER",
  maxMemorySpeedMts: "HIGHER_BETTER",
  systemMemoryBandwidthGbs: "HIGHER_BETTER",
  singleThreadIndex: "HIGHER_BETTER",
  multiThreadIndex: "HIGHER_BETTER",
  gamingIndex: "HIGHER_BETTER",

  /* gpu */
  cudaCoresOrShaders: "HIGHER_BETTER",
  rtCores: "HIGHER_BETTER",
  tensorCores: "HIGHER_BETTER",
  baseClockMhz: "HIGHER_BETTER",
  boostClockMhz: "HIGHER_BETTER",
  vramGb: "HIGHER_BETTER",
  busWidthBits: "HIGHER_BETTER",
  memorySpeedGbps: "HIGHER_BETTER",
  lastLevelCacheMb: "HIGHER_BETTER",
  theoreticalTflops: "HIGHER_BETTER",
  memoryBandwidthGbs: "HIGHER_BETTER",
  effectiveBandwidthGbs: "HIGHER_BETTER",
  bandwidthPerTflop: "HIGHER_BETTER",
  rasterIndex: "HIGHER_BETTER",
  tgpWatts: "LOWER_BETTER",
  lengthMm: "LOWER_BETTER",
  slotWidth: "LOWER_BETTER",

  /* ram */
  capacityGb: "HIGHER_BETTER",
  moduleCount: "NEUTRAL",
  speedMts: "HIGHER_BETTER",
  casLatency: "LOWER_BETTER",
  trueLatencyNs: "LOWER_BETTER",
  voltage: "LOWER_BETTER",
  heightMm: "LOWER_BETTER",
  memoryBandwidthDualGbs: "HIGHER_BETTER",
  ramEfficiencyScore: "HIGHER_BETTER",

  /* storage */
  seqReadMb: "HIGHER_BETTER",
  seqWriteMb: "HIGHER_BETTER",
  randomReadIops: "HIGHER_BETTER",
  randomWriteIops: "HIGHER_BETTER",
  tbw: "HIGHER_BETTER",
  warrantyYears: "HIGHER_BETTER",
  dramCacheMb: "HIGHER_BETTER",
  dwpd: "HIGHER_BETTER",
  interfaceUtilisationPct: "HIGHER_BETTER",
  costPerTb: "LOWER_BETTER",

  /* motherboard */
  memorySlots: "HIGHER_BETTER",
  maxMemoryGb: "HIGHER_BETTER",
  m2Slots: "HIGHER_BETTER",
  pcie5M2Slots: "HIGHER_BETTER",
  sataPorts: "HIGHER_BETTER",
  usbPorts: "HIGHER_BETTER",
  vrmVcorePhases: "HIGHER_BETTER",
  vrmTotalCurrentA: "HIGHER_BETTER",
  lanGbps: "HIGHER_BETTER",
  expansionScore: "HIGHER_BETTER",

  /* value + efficiency (shared shape, per-category meaning) */
  perfPerWatt: "HIGHER_BETTER",
  perfPerDollar: "HIGHER_BETTER",
  costPerGb: "LOWER_BETTER",
  costPerCore: "LOWER_BETTER",
};

export function getPolarity(key: string): MetricPolarity {
  return METRIC_POLARITY_MAP[key] ?? "NEUTRAL";
}

export type Highlight = "winner" | "loser" | "neutral";

/**
 * Classify a row of values against each other, respecting metric polarity.
 *
 * Rules that matter in practice:
 *  - `null` entries are always `neutral` (a missing spec never wins or loses).
 *  - If every present value is equal, the whole row is `neutral` — a tie is not
 *    a win (US1).
 *  - With only one present value there is nothing to compare, so it is neutral.
 *  - Ties at the extreme all receive the same label.
 */
export function getMetricHighlight(
  key: string,
  values: readonly (number | null)[],
): Highlight[] {
  const polarity = getPolarity(key);
  const present = values.filter((value): value is number => finite(value));

  if (polarity === "NEUTRAL" || present.length < 2) {
    return values.map(() => "neutral");
  }

  const max = Math.max(...present);
  const min = Math.min(...present);
  if (max === min) return values.map(() => "neutral");

  const best = polarity === "HIGHER_BETTER" ? max : min;
  const worst = polarity === "HIGHER_BETTER" ? min : max;

  return values.map((value) => {
    if (!finite(value)) return "neutral";
    if (value === best) return "winner";
    if (value === worst) return "loser";
    return "neutral";
  });
}

/**
 * Signed percentage change from `baseline` to `value`, oriented so that a
 * positive number always means "better" regardless of polarity.
 */
export function getRelativeDelta(
  key: string,
  value: number | null,
  baseline: number | null,
): number | null {
  if (!finite(value) || !positive(Math.abs(baseline ?? 0))) return null;
  const base = baseline as number;
  const raw = ((value - base) / Math.abs(base)) * 100;
  return getPolarity(key) === "LOWER_BETTER" ? -raw : raw;
}

/* ----------------------------------------------- per-category derivations */

export interface DerivedValues {
  [key: string]: number | null;
}

/** Compute every derived metric for a component, keyed by metric id. */
export function deriveMetrics(component: ComponentEntity): DerivedValues {
  const releaseYear = component.releaseDate
    ? Number(component.releaseDate.slice(0, 4))
    : null;
  const base: DerivedValues = { msrp: component.msrp, releaseYear };

  switch (component.category) {
    case "cpu":
      return { ...base, ...deriveCpu(component.specs, component.msrp) };
    case "gpu":
      return { ...base, ...deriveGpu(component.specs, component.msrp) };
    case "ram":
      return { ...base, ...deriveRam(component.specs, component.msrp) };
    case "storage":
      return { ...base, ...deriveStorage(component.specs, component.msrp) };
    case "motherboard":
      return { ...base, ...deriveMotherboard(component.specs) };
  }
}

function deriveCpu(specs: CpuSpecs, msrp: number | null): DerivedValues {
  const totalCacheMb = specs.l2CacheMb + specs.l3CacheMb;
  const mt = calcCpuMultiThreadRaw(specs);
  return {
    totalCacheMb,
    cachePerCoreMb: safeDivide(totalCacheMb, specs.totalCores),
    powerPerCoreW: safeDivide(specs.tdpWatts, specs.totalCores),
    systemMemoryBandwidthGbs: calcSystemMemoryBandwidth(
      specs.maxMemorySpeedMts,
      specs.memoryChannels,
    ),
    singleThreadIndexRaw: calcCpuSingleThreadRaw(specs),
    multiThreadIndexRaw: mt,
    gamingIndexRaw: calcCpuGamingRaw(specs),
    perfPerWattRaw: safeDivide(mt, specs.pl2Watts ?? specs.tdpWatts),
    perfPerDollarRaw: safeDivide(mt, msrp),
    costPerCore: safeDivide(msrp, specs.totalCores),
  };
}

function deriveGpu(specs: GpuSpecs, msrp: number | null): DerivedValues {
  const raster = calcGpuRasterRaw(specs);
  return {
    theoreticalTflops: calcGpuTflops(specs.cudaCoresOrShaders, specs.boostClockMhz),
    memoryBandwidthGbs: calcGpuBandwidth(specs.memorySpeedGbps, specs.busWidthBits),
    effectiveBandwidthGbs: calcGpuEffectiveBandwidth(specs),
    bandwidthPerTflop: calcGpuBandwidthPerTflop(specs),
    rasterIndexRaw: raster,
    perfPerWattRaw: safeDivide(raster, specs.tgpWatts),
    perfPerDollarRaw: safeDivide(raster, msrp),
    costPerGb: safeDivide(msrp, specs.vramGb),
  };
}

function deriveRam(specs: RamSpecs, msrp: number | null): DerivedValues {
  const bandwidth = calcSystemMemoryBandwidth(specs.speedMts, 2);
  return {
    trueLatencyNs: calcTrueRamLatency(specs.speedMts, specs.casLatency),
    memoryBandwidthDualGbs: bandwidth,
    ramEfficiencyScore: calcRamEfficiencyScore(specs),
    perfPerDollarRaw: safeDivide(calcRamEfficiencyScore(specs), msrp),
    costPerGb: safeDivide(msrp, specs.capacityGb),
  };
}

function deriveStorage(specs: StorageSpecs, msrp: number | null): DerivedValues {
  return {
    dwpd: calcDwpd(specs.tbw, specs.capacityGb, specs.warrantyYears),
    interfaceUtilisationPct: calcInterfaceUtilisation(specs.seqReadMb, specs.interface),
    costPerTb: safeDivide(msrp, specs.capacityGb / 1000),
    costPerGb: safeDivide(msrp, specs.capacityGb),
    perfPerDollarRaw: safeDivide(specs.seqReadMb, msrp),
  };
}

function deriveMotherboard(specs: MotherboardSpecs): DerivedValues {
  return {
    vrmTotalCurrentA: calcVrmTotalCurrent(specs),
    expansionScore: calcMotherboardExpansionScore(specs),
  };
}
