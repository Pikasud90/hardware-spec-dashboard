import { numericValue, type ResolvedComponent } from "@/lib/catalog";
import type { Category } from "@/lib/validations/component";

/**
 * Build compatibility engine.
 *
 * The problem this solves: picking a processor fixes far more of a build than
 * it looks. It fixes the socket, which fixes the chipset family, which fixes
 * the memory generation, which fixes which kits will POST — and getting any
 * link in that chain wrong means a box that does not turn on.
 *
 * Every rule lives here as an explicit, named check rather than being spread
 * across the UI, so the catalogue filter, the issue list and the upgrade
 * insights all reason from the same facts and cannot contradict each other.
 *
 * Severity has a precise meaning:
 *   blocker — the parts physically cannot work together
 *   warning — they will work, but something is compromised or needs action
 *   info    — worth knowing, nothing is wrong
 */

export const BUILD_SLOTS = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "storage",
  "psu",
] as const;
export type BuildSlot = (typeof BUILD_SLOTS)[number];

/** Which catalogue category fills each slot. */
export const SLOT_CATEGORY: Record<BuildSlot, Category> = {
  cpu: "cpu",
  motherboard: "motherboard",
  ram: "ram",
  gpu: "gpu",
  storage: "storage",
  psu: "psu",
};

export const SLOT_LABELS: Record<BuildSlot, string> = {
  cpu: "Processor",
  motherboard: "Motherboard",
  ram: "Memory",
  gpu: "Graphics card",
  storage: "Storage",
  psu: "Power supply",
};

/**
 * Slot order is not cosmetic. The processor comes first because it constrains
 * the most, and each later slot is filtered by everything already chosen.
 */
export const SLOT_ORDER: BuildSlot[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "storage",
  "psu",
];

export type BuildSelection = Partial<Record<BuildSlot, ResolvedComponent>>;

export type IssueLevel = "blocker" | "warning" | "info";

export interface CompatibilityIssue {
  level: IssueLevel;
  slots: BuildSlot[];
  title: string;
  detail: string;
  /** What the user can do about it, when there is a concrete action. */
  fix?: string;
}

const text = (component: ResolvedComponent | undefined, key: string): string | null => {
  const value = component?.values[key];
  return typeof value === "string" ? value : null;
};

const bool = (component: ResolvedComponent | undefined, key: string): boolean =>
  component?.values[key] === true;

/* --------------------------------------------------------- power estimate */

/** Fixed draw allowances for parts the catalogue does not model individually. */
export const POWER_ALLOWANCES = {
  motherboard: 40,
  ramPerModule: 3,
  nvmeDrive: 8,
  sataDrive: 3,
  fansAndPeripherals: 30,
};

/**
 * Recommended headroom over estimated draw.
 *
 * 1.4x rather than a bare margin: it covers the transient spikes modern
 * graphics cards produce well above rated board power, and keeps the unit near
 * 50-70% load where efficiency peaks and the fan stays slow.
 */
export const PSU_HEADROOM_FACTOR = 1.4;

export interface PowerEstimate {
  cpuWatts: number;
  gpuWatts: number;
  otherWatts: number;
  totalWatts: number;
  recommendedPsuWatts: number;
  psuWatts: number | null;
  /** Fraction of the chosen PSU's rating this build would draw. */
  loadFraction: number | null;
}

export function estimatePower(build: BuildSelection): PowerEstimate {
  // Sustained turbo power, not base TDP — base TDP understates a modern
  // processor under load by a wide margin.
  const cpuWatts =
    numericValue(build.cpu, "pl2Watts") ?? numericValue(build.cpu, "tdpWatts") ?? 0;
  const gpuWatts = numericValue(build.gpu, "tgpWatts") ?? 0;

  const ramModules = numericValue(build.ram, "moduleCount") ?? 0;
  const storageInterface = text(build.storage, "interface") ?? "";
  const storageWatts = build.storage
    ? storageInterface.startsWith("SATA")
      ? POWER_ALLOWANCES.sataDrive
      : POWER_ALLOWANCES.nvmeDrive
    : 0;

  const otherWatts =
    (build.motherboard ? POWER_ALLOWANCES.motherboard : 0) +
    ramModules * POWER_ALLOWANCES.ramPerModule +
    storageWatts +
    POWER_ALLOWANCES.fansAndPeripherals;

  const totalWatts = cpuWatts + gpuWatts + otherWatts;
  const psuWatts = numericValue(build.psu, "wattage");

  return {
    cpuWatts,
    gpuWatts,
    otherWatts,
    totalWatts,
    recommendedPsuWatts: Math.ceil((totalWatts * PSU_HEADROOM_FACTOR) / 50) * 50,
    psuWatts,
    loadFraction: psuWatts && psuWatts > 0 ? totalWatts / psuWatts : null,
  };
}

/* ------------------------------------------------------- pairwise checks */

/**
 * Can `candidate` join `build` in `slot`?
 *
 * Returns only hard blockers — the checks that make a build impossible rather
 * than merely suboptimal. This is what drives the catalogue filter, so it must
 * never hide a part that would actually work.
 */
export function checkSlotCandidate(
  candidate: ResolvedComponent,
  slot: BuildSlot,
  build: BuildSelection,
): { ok: boolean; reason?: string } {
  const { cpu, motherboard, ram, gpu, psu } = build;

  if (slot === "motherboard" && cpu) {
    const cpuSocket = text(cpu, "socket");
    const boardSocket = text(candidate, "socket");
    if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
      return { ok: false, reason: `${boardSocket} board — ${cpu.name} needs ${cpuSocket}` };
    }
  }

  if (slot === "cpu" && motherboard) {
    const boardSocket = text(motherboard, "socket");
    const cpuSocket = text(candidate, "socket");
    if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
      return { ok: false, reason: `${cpuSocket} processor — board is ${boardSocket}` };
    }
  }

  if (slot === "ram") {
    const kitType = text(candidate, "generation");
    const boardType = text(motherboard, "memoryType");
    if (kitType && boardType && kitType !== boardType) {
      return { ok: false, reason: `${kitType} kit — board takes ${boardType}` };
    }
    const cpuType = text(cpu, "memoryType");
    if (kitType && cpuType && kitType !== cpuType) {
      return { ok: false, reason: `${kitType} kit — ${cpu?.name} controller is ${cpuType}` };
    }
    const slots = numericValue(motherboard, "memorySlots");
    const modules = numericValue(candidate, "moduleCount");
    if (slots !== null && modules !== null && modules > slots) {
      return { ok: false, reason: `${modules} modules — board has ${slots} slots` };
    }
    const maxCapacity = numericValue(motherboard, "maxMemoryGb");
    const capacity = numericValue(candidate, "capacityGb");
    if (maxCapacity !== null && capacity !== null && capacity > maxCapacity) {
      return { ok: false, reason: `${capacity} GB exceeds the board's ${maxCapacity} GB limit` };
    }
  }

  if (slot === "motherboard" && ram) {
    const kitType = text(ram, "generation");
    const boardType = text(candidate, "memoryType");
    if (kitType && boardType && kitType !== boardType) {
      return { ok: false, reason: `${boardType} board — your kit is ${kitType}` };
    }
  }

  if (slot === "storage" && motherboard) {
    const isM2 = (text(candidate, "formFactor") ?? "").startsWith("M.2");
    const m2Slots = numericValue(motherboard, "m2Slots") ?? 0;
    if (isM2 && m2Slots === 0) {
      return { ok: false, reason: "Board has no M.2 slot" };
    }
    const isSata = (text(candidate, "interface") ?? "").startsWith("SATA");
    const sataPorts = numericValue(motherboard, "sataPorts") ?? 0;
    if (isSata && sataPorts === 0) {
      return { ok: false, reason: "Board has no SATA port" };
    }
  }

  if (slot === "psu") {
    // A unit that cannot carry the estimated draw at all is a blocker; merely
    // tight headroom is a warning raised later, not a filter.
    const estimate = estimatePower({ ...build, psu: candidate });
    const wattage = numericValue(candidate, "wattage");
    if (wattage !== null && estimate.totalWatts > 0 && wattage < estimate.totalWatts) {
      return {
        ok: false,
        reason: `${wattage} W cannot carry an estimated ${Math.round(estimate.totalWatts)} W draw`,
      };
    }
  }

  if (slot === "gpu" && psu) {
    const estimate = estimatePower({ ...build, gpu: candidate });
    const wattage = numericValue(psu, "wattage");
    if (wattage !== null && estimate.totalWatts > wattage) {
      return {
        ok: false,
        reason: `Needs about ${Math.round(estimate.totalWatts)} W — your ${wattage} W unit cannot carry it`,
      };
    }
  }

  if (slot === "cpu" && ram) {
    const kitType = text(ram, "generation");
    const cpuType = text(candidate, "memoryType");
    if (kitType && cpuType && kitType !== cpuType) {
      return { ok: false, reason: `${cpuType} controller — your kit is ${kitType}` };
    }
  }

  return { ok: true };
}

/** Filter a candidate list down to the parts that can actually join the build. */
export function filterCompatible(
  candidates: readonly ResolvedComponent[],
  slot: BuildSlot,
  build: BuildSelection,
): { compatible: ResolvedComponent[]; rejected: Array<{ component: ResolvedComponent; reason: string }> } {
  const compatible: ResolvedComponent[] = [];
  const rejected: Array<{ component: ResolvedComponent; reason: string }> = [];

  for (const candidate of candidates) {
    const result = checkSlotCandidate(candidate, slot, build);
    if (result.ok) compatible.push(candidate);
    else rejected.push({ component: candidate, reason: result.reason ?? "Not compatible" });
  }
  return { compatible, rejected };
}

export { text as specText, bool as specBool };

/* ------------------------------------------------------------ full audit */

/**
 * Audit a complete (or partial) build.
 *
 * Blockers are reported even though `filterCompatible` should have prevented
 * them, because a build can also arrive from a shared URL where the parts were
 * never filtered.
 */
export function auditBuild(build: BuildSelection): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { cpu, motherboard, ram, gpu, storage, psu } = build;
  const power = estimatePower(build);

  /* ---- socket ---- */
  if (cpu && motherboard) {
    const cpuSocket = text(cpu, "socket");
    const boardSocket = text(motherboard, "socket");
    if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
      issues.push({
        level: "blocker",
        slots: ["cpu", "motherboard"],
        title: "Socket mismatch",
        detail: `${cpu.name} is ${cpuSocket}; ${motherboard.name} is ${boardSocket}. The processor physically will not seat.`,
        fix: `Choose a ${cpuSocket} motherboard, or a ${boardSocket} processor.`,
      });
    }

    // Newer silicon on an older chipset of the same socket generally needs a
    // BIOS update applied before the CPU will POST.
    const cpuArch = text(cpu, "architecture");
    const chipset = text(motherboard, "chipset") ?? "";
    if (cpuArch === "Zen 5" && /^(B650|X670|A620)/.test(chipset)) {
      issues.push({
        level: "info",
        slots: ["cpu", "motherboard"],
        title: "BIOS update likely required",
        detail: `Zen 5 processors need a recent BIOS on ${chipset} boards, which launched before this generation.`,
        fix: "Check the board's CPU support list. Boards with USB BIOS Flashback can update without a working processor fitted.",
      });
    }
    if (cpuArch === "Arrow Lake" && /^(Z790|B760|Z690)/.test(chipset)) {
      issues.push({
        level: "blocker",
        slots: ["cpu", "motherboard"],
        title: "Wrong platform generation",
        detail: `${cpu.name} is LGA1851; ${chipset} boards are LGA1700. These are different sockets despite the similar naming.`,
        fix: "Pair Core Ultra 200S processors with a Z890, B860 or H810 board.",
      });
    }
  }

  /* ---- memory ---- */
  if (ram && motherboard) {
    const kitType = text(ram, "generation");
    const boardType = text(motherboard, "memoryType");
    if (kitType && boardType && kitType !== boardType) {
      issues.push({
        level: "blocker",
        slots: ["ram", "motherboard"],
        title: "Memory generation mismatch",
        detail: `${kitType} modules do not fit a ${boardType} board — the slots are keyed differently.`,
        fix: `Choose a ${boardType} kit.`,
      });
    }

    const kitSpeed = numericValue(ram, "speedMts");
    const boardMax = numericValue(motherboard, "maxMemorySpeedMts");
    if (kitSpeed !== null && boardMax !== null && kitSpeed > boardMax) {
      issues.push({
        level: "warning",
        slots: ["ram", "motherboard"],
        title: "Kit is faster than the board is validated for",
        detail: `The kit is rated ${kitSpeed} MT/s; ${motherboard.name} is validated to ${boardMax} MT/s. It will run, but at the lower speed.`,
        fix: `A ${boardMax} MT/s kit would cost less and perform identically here.`,
      });
    }

    const modules = numericValue(ram, "moduleCount") ?? 0;
    if (modules === 4 && (kitSpeed ?? 0) > 6000) {
      issues.push({
        level: "warning",
        slots: ["ram"],
        title: "Four high-speed modules",
        detail:
          "Populating all four slots loads the memory controller much harder. Four-module kits above 6000 MT/s frequently fail to reach their rated speed.",
        fix: "Prefer a two-module kit of the same total capacity.",
      });
    }
  }

  if (ram && cpu) {
    const kitSpeed = numericValue(ram, "speedMts");
    const cpuMax = numericValue(cpu, "maxMemorySpeedMts");
    if (kitSpeed !== null && cpuMax !== null && kitSpeed > cpuMax) {
      issues.push({
        level: "info",
        slots: ["ram", "cpu"],
        title: "Above the processor's official memory speed",
        detail: `${cpu.name} officially supports ${cpuMax} MT/s; this kit is rated ${kitSpeed} MT/s. Running it at full speed is an overclock.`,
        fix: "Enable the EXPO or XMP profile in BIOS. This is routine and stable on almost all modern platforms.",
      });
    }
  }

  /* ---- graphics and power ---- */
  if (gpu && psu) {
    const required = numericValue(gpu, "tgpWatts") ?? 0;
    const connectors = text(gpu, "powerConnectors") ?? "";
    const has12vhpwr = (numericValue(psu, "pcie12vhpwrConnectors") ?? 0) > 0;
    const eightPin = numericValue(psu, "pcie8PinConnectors") ?? 0;

    if (/16-pin|12VHPWR|12V-2x6/i.test(connectors) && !has12vhpwr) {
      issues.push({
        level: "warning",
        slots: ["gpu", "psu"],
        title: "No native 12V-2x6 connector",
        detail: `${gpu.name} uses a 16-pin power connector; ${psu.name} has none, so it must run off the adapter bundled with the card.`,
        fix:
          required >= 400
            ? "At this power level a unit with a native cable is worth the difference — adapters concentrate all the current into one poorly-seated joint."
            : "The bundled adapter is acceptable here, but seat it fully.",
      });
    }

    const needed8Pin = (connectors.match(/(\d)x 8-pin/)?.[1] ?? "0") as string;
    if (Number(needed8Pin) > eightPin && !has12vhpwr) {
      issues.push({
        level: "blocker",
        slots: ["gpu", "psu"],
        title: "Not enough PCIe power connectors",
        detail: `${gpu.name} needs ${needed8Pin}x 8-pin; ${psu.name} provides ${eightPin}.`,
        fix: "Choose a unit with more PCIe cables. Daisy-chaining one cable to feed two sockets is not adequate at this power level.",
      });
    }
  }

  if (psu && power.totalWatts > 0 && power.loadFraction !== null) {
    if (power.loadFraction > 0.9) {
      issues.push({
        level: "warning",
        slots: ["psu"],
        title: "Very little power headroom",
        detail: `Estimated draw is about ${Math.round(power.totalWatts)} W against a ${power.psuWatts} W unit — roughly ${Math.round(power.loadFraction * 100)}% load. Graphics transients can exceed rated board power substantially and may trip protection.`,
        fix: `A ${power.recommendedPsuWatts} W unit would sit near the efficiency sweet spot.`,
      });
    } else if (power.loadFraction < 0.3 && (power.psuWatts ?? 0) > 750) {
      issues.push({
        level: "info",
        slots: ["psu"],
        title: "Power supply is oversized",
        detail: `Estimated draw is only about ${Math.round(power.totalWatts)} W — roughly ${Math.round(power.loadFraction * 100)}% of this unit. Efficiency falls off below 20% load.`,
        fix: `A ${power.recommendedPsuWatts} W unit would cost less and run closer to peak efficiency.`,
      });
    }
  }

  /* ---- VRM sizing ---- */
  if (cpu && motherboard) {
    const cpuPower = numericValue(cpu, "pl2Watts") ?? numericValue(cpu, "tdpWatts") ?? 0;
    const vrmCurrent = numericValue(motherboard, "vrmTotalCurrentA") ?? 0;
    // Roughly: sustained Vcore current ≈ package watts / 1.25 V.
    const estimatedDraw = cpuPower / 1.25;
    if (vrmCurrent > 0 && estimatedDraw > vrmCurrent * 0.85) {
      issues.push({
        level: "warning",
        slots: ["cpu", "motherboard"],
        title: "VRM is marginal for this processor",
        detail: `${cpu.name} can pull about ${Math.round(estimatedDraw)} A sustained; ${motherboard.name} provides ${Math.round(vrmCurrent)} A total. Expect the board to run hot and throttle under long all-core loads.`,
        fix: "Choose a board with more or higher-current power stages for sustained multi-threaded work.",
      });
    }
  }

  /* ---- storage interface ---- */
  if (storage && motherboard) {
    const driveInterface = text(storage, "interface") ?? "";
    const gen5Slots = numericValue(motherboard, "pcie5M2Slots") ?? 0;
    if (driveInterface.startsWith("PCIe 5.0") && gen5Slots === 0) {
      issues.push({
        level: "warning",
        slots: ["storage", "motherboard"],
        title: "Gen 5 drive in a Gen 4 slot",
        detail: `${storage.name} is a PCIe 5.0 drive but ${motherboard.name} has no PCIe 5.0 M.2 slot. It will run at roughly half its rated sequential speed.`,
        fix: "A PCIe 4.0 drive would perform identically here and cost noticeably less.",
      });
    }
  }

  /* ---- things the catalogue does not model ---- */
  if (cpu && !bool(cpu, "coolerIncluded")) {
    issues.push({
      level: "info",
      slots: ["cpu"],
      title: "No cooler in the box",
      detail: `${cpu.name} ships without a cooler, and this planner does not track coolers.`,
      fix: `Budget separately for one sized to about ${numericValue(cpu, "pl2Watts") ?? numericValue(cpu, "tdpWatts") ?? 0} W.`,
    });
  }

  if (gpu && motherboard) {
    const cardLength = numericValue(gpu, "lengthMm");
    if (cardLength !== null && cardLength >= 300) {
      issues.push({
        level: "info",
        slots: ["gpu"],
        title: "Long graphics card",
        detail: `${gpu.name} is ${cardLength} mm. Cases are not tracked here, so check clearance against yours.`,
      });
    }
  }

  const order: Record<IssueLevel, number> = { blocker: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

/** Total price of the selected parts, and which slots have no price. */
export function buildTotal(build: BuildSelection): {
  total: number;
  priced: number;
  missingPrice: BuildSlot[];
  filled: number;
} {
  let total = 0;
  let priced = 0;
  const missingPrice: BuildSlot[] = [];
  let filled = 0;

  for (const slot of SLOT_ORDER) {
    const component = build[slot];
    if (!component) continue;
    filled += 1;
    if (component.inrPrice === null) missingPrice.push(slot);
    else {
      total += component.inrPrice;
      priced += 1;
    }
  }
  return { total, priced, missingPrice, filled };
}

/* ---------------------------------------------------------- build insights */

export type InsightKind = "upgrade" | "saving" | "balance";

export interface BuildInsight {
  kind: InsightKind;
  slot: BuildSlot;
  title: string;
  detail: string;
  /** Rupee change if applied: positive costs more, negative saves. */
  deltaInr: number | null;
  /** The part being suggested, when the insight is a swap. */
  suggestion?: ResolvedComponent;
}

/** Cheapest compatible candidate that satisfies `predicate`. */
function cheapestWhere(
  candidates: readonly ResolvedComponent[],
  slot: BuildSlot,
  build: BuildSelection,
  predicate: (component: ResolvedComponent) => boolean,
): ResolvedComponent | undefined {
  return filterCompatible(candidates, slot, build)
    .compatible.filter(
      (component) =>
        component.inrPrice !== null &&
        component.availability !== "discontinued" &&
        predicate(component),
    )
    .sort((a, b) => (a.inrPrice as number) - (b.inrPrice as number))[0];
}

/**
 * Concrete, costed suggestions for an existing build.
 *
 * Each one names a specific part, states the measurable effect, and gives the
 * rupee difference — because "faster memory helps" is not actionable, whereas
 * "this kit cuts latency 18% for ₹1,400 more" is.
 */
export function generateInsights(
  build: BuildSelection,
  catalogue: Record<Category, ResolvedComponent[]>,
): BuildInsight[] {
  const insights: BuildInsight[] = [];
  const { cpu, motherboard, ram, gpu, storage, psu } = build;
  const power = estimatePower(build);

  /* ---- memory: latency is what moves, not the headline speed ---- */
  if (ram && ram.inrPrice !== null) {
    const ramPrice = ram.inrPrice;
    const currentLatency = numericValue(ram, "trueLatencyNs");
    const currentBandwidth = numericValue(ram, "memoryBandwidthDualGbs");
    const capacity = numericValue(ram, "capacityGb");

    const better = filterCompatible(catalogue.ram, "ram", build)
      .compatible.filter((kit) => {
        if (kit.id === ram.id || kit.inrPrice === null) return false;
        if (kit.availability === "discontinued") return false;
        // Same or more capacity — a latency win that costs capacity is not a win.
        if ((numericValue(kit, "capacityGb") ?? 0) < (capacity ?? 0)) return false;
        const latency = numericValue(kit, "trueLatencyNs");
        const bandwidth = numericValue(kit, "memoryBandwidthDualGbs");
        return (
          latency !== null &&
          currentLatency !== null &&
          latency < currentLatency &&
          (bandwidth ?? 0) >= (currentBandwidth ?? 0)
        );
      })
      .sort((a, b) => (a.inrPrice as number) - (b.inrPrice as number))[0];

    if (better) {
      const newLatency = numericValue(better, "trueLatencyNs") as number;
      const improvement = ((currentLatency as number) - newLatency) / (currentLatency as number);
      const delta = (better.inrPrice as number) - ramPrice;
      insights.push({
        kind: "upgrade",
        slot: "ram",
        title: `${(improvement * 100).toFixed(0)}% lower memory latency`,
        detail: `${better.name} runs at ${newLatency.toFixed(2)} ns true latency against your kit's ${(currentLatency as number).toFixed(2)} ns, with equal or greater bandwidth. Memory latency is the single biggest memory-side lever on gaming frame rates and on anything with a large working set.`,
        deltaInr: delta,
        suggestion: better,
      });
    }

    // The reverse: same real-world behaviour for less money.
    const cheaper = filterCompatible(catalogue.ram, "ram", build)
      .compatible.filter((kit) => {
        if (kit.id === ram.id || kit.inrPrice === null) return false;
        if (kit.availability === "discontinued") return false;
        if ((numericValue(kit, "capacityGb") ?? 0) < (capacity ?? 0)) return false;
        const latency = numericValue(kit, "trueLatencyNs");
        return (
          kit.inrPrice < ramPrice &&
          latency !== null &&
          currentLatency !== null &&
          latency <= currentLatency * 1.08
        );
      })
      .sort((a, b) => (a.inrPrice as number) - (b.inrPrice as number))[0];

    if (cheaper) {
      insights.push({
        kind: "saving",
        slot: "ram",
        title: `Save ${Math.round(ramPrice - (cheaper.inrPrice as number)).toLocaleString("en-IN")} rupees on memory`,
        detail: `${cheaper.name} is within 8% of your kit's true latency at the same capacity. At that margin the difference is not measurable outside a benchmark.`,
        deltaInr: (cheaper.inrPrice as number) - ramPrice,
        suggestion: cheaper,
      });
    }
  }

  /* ---- storage: interface generation is usually the wrong thing to pay for ---- */
  if (storage && storage.inrPrice !== null) {
    const driveInterface = text(storage, "interface") ?? "";
    const capacity = numericValue(storage, "capacityGb");
    const randomRead = numericValue(storage, "randomReadIops");

    if (driveInterface.startsWith("PCIe 5.0")) {
      const gen4 = cheapestWhere(catalogue.storage, "storage", build, (drive) => {
        const iface = text(drive, "interface") ?? "";
        return (
          iface.startsWith("PCIe 4.0") &&
          (numericValue(drive, "capacityGb") ?? 0) >= (capacity ?? 0) &&
          (numericValue(drive, "randomReadIops") ?? 0) >= (randomRead ?? 0) * 0.7 &&
          (drive.inrPrice as number) < (storage.inrPrice as number)
        );
      });
      if (gen4) {
        const saving = (storage.inrPrice as number) - (gen4.inrPrice as number);
        insights.push({
          kind: "saving",
          slot: "storage",
          title: `Save ${Math.round(saving).toLocaleString("en-IN")} rupees by dropping to PCIe 4.0`,
          detail: `${gen4.name} gives the same capacity and comparable random performance. Game load times and application launches are dominated by random access and queue depth, not sequential throughput — the Gen 5 sequential advantage is close to invisible outside large file transfers, and Gen 5 drives run considerably hotter.`,
          deltaInr: -saving,
          suggestion: gen4,
        });
      }
    }

    if (driveInterface.startsWith("PCIe 4.0") || driveInterface.startsWith("PCIe 5.0")) {
      const gen3 = cheapestWhere(catalogue.storage, "storage", build, (drive) => {
        const iface = text(drive, "interface") ?? "";
        return (
          iface.startsWith("PCIe 3.0") &&
          (numericValue(drive, "capacityGb") ?? 0) >= (capacity ?? 0) * 0.9 &&
          (drive.inrPrice as number) < (storage.inrPrice as number) * 0.6
        );
      });
      if (gen3) {
        const saving = (storage.inrPrice as number) - (gen3.inrPrice as number);
        insights.push({
          kind: "saving",
          slot: "storage",
          title: `A PCIe 3.0 drive would save ${Math.round(saving).toLocaleString("en-IN")} rupees`,
          detail: `${gen3.name} is materially slower on paper, and for a secondary or bulk-storage drive that difference does not surface in use. Worth considering if the budget is tight elsewhere — keep the faster drive as your boot volume.`,
          deltaInr: -saving,
          suggestion: gen3,
        });
      }
    }
  }

  /* ---- power supply: right-size rather than over-buy ---- */
  if (power.totalWatts > 0) {
    const target = power.recommendedPsuWatts;
    const rightSized = cheapestWhere(
      catalogue.psu,
      "psu",
      build,
      (unit) => (numericValue(unit, "wattage") ?? 0) >= target,
    );
    if (rightSized && (!psu || rightSized.id !== psu.id)) {
      const delta = (rightSized.inrPrice as number) - (psu?.inrPrice ?? 0);
      insights.push({
        kind: psu ? (delta < 0 ? "saving" : "upgrade") : "upgrade",
        slot: "psu",
        title: psu
          ? delta < 0
            ? `A right-sized unit saves ${Math.abs(Math.round(delta)).toLocaleString("en-IN")} rupees`
            : `${target} W is the sensible target`
          : `Target about ${target} W`,
        detail: `Estimated draw is around ${Math.round(power.totalWatts)} W. Sizing to ${target} W leaves headroom for graphics transients and keeps the unit near 50-70% load, where efficiency peaks and the fan stays slow. ${rightSized.name} is the cheapest compatible unit that clears it.`,
        deltaInr: psu ? delta : rightSized.inrPrice,
        suggestion: rightSized,
      });
    }
  }

  /* ---- CPU / GPU balance ---- */
  if (cpu && gpu) {
    const cpuGaming = numericValue(cpu, "gamingIndex") ?? 0;
    const gpuRaster = numericValue(gpu, "rasterIndex") ?? 0;
    const gap = cpuGaming - gpuRaster;

    if (gap > 35) {
      insights.push({
        kind: "balance",
        slot: "gpu",
        title: "Graphics card is the limiting part",
        detail: `${cpu.name} scores ${cpuGaming.toFixed(0)} on the gaming index against ${gpu.name}'s ${gpuRaster.toFixed(0)} raster index. At 1440p and above the graphics card will be the constraint, so budget moved from processor to graphics would buy more frames.`,
        deltaInr: null,
      });
    } else if (gap < -35) {
      insights.push({
        kind: "balance",
        slot: "cpu",
        title: "Processor may hold the graphics card back",
        detail: `${gpu.name} scores ${gpuRaster.toFixed(0)} against ${cpu.name}'s ${cpuGaming.toFixed(0)} gaming index. At 1080p, and in simulation-heavy or CPU-bound titles, the processor will cap frame rates before the card is fully used.`,
        deltaInr: null,
      });
    }
  }

  /* ---- motherboard: pay for what the processor can use ---- */
  if (cpu && motherboard && motherboard.inrPrice !== null) {
    const cpuPower = numericValue(cpu, "pl2Watts") ?? numericValue(cpu, "tdpWatts") ?? 0;
    const required = (cpuPower / 1.25) * 1.25; // amps needed, with margin
    const cheaper = cheapestWhere(
      catalogue.motherboard,
      "motherboard",
      build,
      (board) =>
        (numericValue(board, "vrmTotalCurrentA") ?? 0) >= required &&
        (numericValue(board, "m2Slots") ?? 0) >= (numericValue(motherboard, "m2Slots") ?? 0) &&
        (board.inrPrice as number) < (motherboard.inrPrice as number) * 0.8,
    );
    if (cheaper) {
      const saving = (motherboard.inrPrice as number) - (cheaper.inrPrice as number);
      insights.push({
        kind: "saving",
        slot: "motherboard",
        title: `Save ${Math.round(saving).toLocaleString("en-IN")} rupees on the motherboard`,
        detail: `${cheaper.name} still carries enough VRM current for ${cpu.name} and at least as many M.2 slots. Above that threshold, extra board spend buys networking, audio and aesthetics rather than performance.`,
        deltaInr: -saving,
        suggestion: cheaper,
      });
    }
  }

  return insights;
}
