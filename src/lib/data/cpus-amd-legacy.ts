import type { ComponentInput } from "@/lib/validations/component";

/**
 * AMD desktop processors from the Bulldozer era through Zen 2.
 *
 * The FX parts are included precisely because they were uncompetitive: their
 * per-clock throughput is roughly half of contemporary Intel, and having that
 * visible on the same axis is what makes the scale of Zen's turnaround legible
 * rather than a claim.
 */
export const CPUS_AMD_LEGACY: ComponentInput[] = [
  /* ---------------------------------- Bulldozer family · AM3+ · 2012-2013 */
  {
    id: "amd-fx-6300", slug: "amd-fx-6300", name: "AMD FX-6300",
    brand: "AMD", series: "FX", category: "cpu", msrp: 132,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2012-10-23",
    summary: "Six Piledriver integer cores sharing three floating-point units. Cheap and heavily marketed on core count, but per-core throughput was far behind Intel.",
    specs: {
      segment: "FX", socket: "AM3+", architecture: "Piledriver", codename: "Vishera",
      processNodeNm: 32, totalCores: 6, threads: 6, baseClockGhz: 3.5, boostClockGhz: 4.1,
      l2CacheMb: 6, l3CacheMb: 8, tdpWatts: 95,
      pcieVersion: "PCIe 2.0", pcieLanes: 16, memoryType: "DDR3", memoryChannels: 2,
      maxMemorySpeedMts: 1866, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-fx-8350", slug: "amd-fx-8350", name: "AMD FX-8350",
    brand: "AMD", series: "FX", category: "cpu", msrp: 195,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2012-10-23",
    summary: "The best-known FX part. Eight integer cores at 4 GHz, competitive in heavily threaded work and well behind in everything else.",
    specs: {
      segment: "FX", socket: "AM3+", architecture: "Piledriver", codename: "Vishera",
      processNodeNm: 32, totalCores: 8, threads: 8, baseClockGhz: 4.0, boostClockGhz: 4.2,
      l2CacheMb: 8, l3CacheMb: 8, tdpWatts: 125,
      pcieVersion: "PCIe 2.0", pcieLanes: 16, memoryType: "DDR3", memoryChannels: 2,
      maxMemorySpeedMts: 1866, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-fx-9590", slug: "amd-fx-9590", name: "AMD FX-9590",
    brand: "AMD", series: "FX", category: "cpu", msrp: 878,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2013-06-11",
    summary: "220 W for eight Piledriver cores at 5 GHz — the highest-power mainstream desktop processor ever sold, and effectively a factory overclock of the FX-8350.",
    specs: {
      segment: "FX", socket: "AM3+", architecture: "Piledriver", codename: "Vishera",
      processNodeNm: 32, totalCores: 8, threads: 8, baseClockGhz: 4.7, boostClockGhz: 5.0,
      l2CacheMb: 8, l3CacheMb: 8, tdpWatts: 220,
      pcieVersion: "PCIe 2.0", pcieLanes: 16, memoryType: "DDR3", memoryChannels: 2,
      maxMemorySpeedMts: 1866, unlocked: true,
    },
  },

  /* --------------------------------------- Ryzen 1000 · Zen · AM4 · 2017 */
  {
    id: "amd-ryzen-3-1200", slug: "amd-ryzen-3-1200", name: "AMD Ryzen 3 1200",
    brand: "AMD", series: "Ryzen 1000", category: "cpu", msrp: 109,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2017-07-27",
    summary: "Entry Zen quad-core. Unlocked, which no Intel part at this price was.",
    specs: {
      segment: "Ryzen 3", socket: "AM4", architecture: "Zen", codename: "Summit Ridge",
      processNodeNm: 14, totalCores: 4, threads: 4, baseClockGhz: 3.1, boostClockGhz: 3.4,
      l2CacheMb: 2, l3CacheMb: 8, tdpWatts: 65,
      pcieVersion: "PCIe 3.0", pcieLanes: 20, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2667, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-5-1600", slug: "amd-ryzen-5-1600", name: "AMD Ryzen 5 1600",
    brand: "AMD", series: "Ryzen 1000", category: "cpu", msrp: 219,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2017-04-11",
    summary: "Six cores and twelve threads at a price Intel was charging for four cores. The part that made Ryzen's case to mainstream buyers.",
    specs: {
      segment: "Ryzen 5", socket: "AM4", architecture: "Zen", codename: "Summit Ridge",
      processNodeNm: 14, totalCores: 6, threads: 12, baseClockGhz: 3.2, boostClockGhz: 3.6,
      l2CacheMb: 3, l3CacheMb: 16, tdpWatts: 65,
      pcieVersion: "PCIe 3.0", pcieLanes: 20, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2667, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-7-1800x", slug: "amd-ryzen-7-1800x", name: "AMD Ryzen 7 1800X",
    brand: "AMD", series: "Ryzen 1000", category: "cpu", msrp: 499,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2017-03-02",
    summary: "Zen's launch flagship: eight cores against Intel's four at the same price. Gaming performance lagged, but the core-count argument was decisive.",
    specs: {
      segment: "Ryzen 7", socket: "AM4", architecture: "Zen", codename: "Summit Ridge",
      processNodeNm: 14, totalCores: 8, threads: 16, baseClockGhz: 3.6, boostClockGhz: 4.0,
      l2CacheMb: 4, l3CacheMb: 16, tdpWatts: 95,
      pcieVersion: "PCIe 3.0", pcieLanes: 20, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2667, unlocked: true,
    },
  },

  /* -------------------------------------- Ryzen 2000 · Zen+ · AM4 · 2018 */
  {
    id: "amd-ryzen-5-2600", slug: "amd-ryzen-5-2600", name: "AMD Ryzen 5 2600",
    brand: "AMD", series: "Ryzen 2000", category: "cpu", msrp: 199,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2018-04-19",
    summary: "Zen+ on 12 nm — modest clock and latency improvements over Zen, and for a long stretch the default budget six-core.",
    specs: {
      segment: "Ryzen 5", socket: "AM4", architecture: "Zen+", codename: "Pinnacle Ridge",
      processNodeNm: 12, totalCores: 6, threads: 12, baseClockGhz: 3.4, boostClockGhz: 3.9,
      l2CacheMb: 3, l3CacheMb: 16, tdpWatts: 65,
      pcieVersion: "PCIe 3.0", pcieLanes: 20, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2933, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-7-2700x", slug: "amd-ryzen-7-2700x", name: "AMD Ryzen 7 2700X",
    brand: "AMD", series: "Ryzen 2000", category: "cpu", msrp: 329,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2018-04-19",
    summary: "Zen+ flagship, shipped with the Wraith Prism cooler and a meaningful boost-clock improvement over the 1800X.",
    specs: {
      segment: "Ryzen 7", socket: "AM4", architecture: "Zen+", codename: "Pinnacle Ridge",
      processNodeNm: 12, totalCores: 8, threads: 16, baseClockGhz: 3.7, boostClockGhz: 4.3,
      l2CacheMb: 4, l3CacheMb: 16, tdpWatts: 105,
      pcieVersion: "PCIe 3.0", pcieLanes: 20, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2933, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-3-3200g", slug: "amd-ryzen-3-3200g", name: "AMD Ryzen 3 3200G",
    brand: "AMD", series: "Ryzen 3000G", category: "cpu", msrp: 99,
    inrPrice: 6000, priceConfidence: "medium", availability: "limited",
    releaseDate: "2019-07-07",
    summary: "Zen+ with Vega 8 graphics. For years the standard answer to building a usable desktop with no graphics card at all.",
    specs: {
      segment: "Ryzen 3", socket: "AM4", architecture: "Zen+", codename: "Picasso",
      processNodeNm: 12, totalCores: 4, threads: 4, baseClockGhz: 3.6, boostClockGhz: 4.0,
      l2CacheMb: 2, l3CacheMb: 4, tdpWatts: 65, integratedGraphics: "Radeon Vega 8",
      pcieVersion: "PCIe 3.0", pcieLanes: 8, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 2933, unlocked: true, coolerIncluded: true, gpuCores: 8,
    },
  },

  /* -------------------------------------- Ryzen 3000 · Zen 2 · AM4 · 2019 */
  {
    id: "amd-ryzen-5-3600", slug: "amd-ryzen-5-3600", name: "AMD Ryzen 5 3600",
    brand: "AMD", series: "Ryzen 3000", category: "cpu", msrp: 199,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2019-07-07",
    summary: "Among the best-selling enthusiast processors ever made. Zen 2 brought AMD level with Intel per-clock, at six cores for a mid-range price.",
    specs: {
      segment: "Ryzen 5", socket: "AM4", architecture: "Zen 2", codename: "Matisse",
      processNodeNm: 7, totalCores: 6, threads: 12, baseClockGhz: 3.6, boostClockGhz: 4.2,
      l2CacheMb: 3, l3CacheMb: 32, tdpWatts: 65,
      pcieVersion: "PCIe 4.0", pcieLanes: 24, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 3200, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-7-3700x", slug: "amd-ryzen-7-3700x", name: "AMD Ryzen 7 3700X",
    brand: "AMD", series: "Ryzen 3000", category: "cpu", msrp: 329,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2019-07-07",
    summary: "Eight Zen 2 cores inside 65 W, and the first AMD desktop platform with PCIe 4.0.",
    specs: {
      segment: "Ryzen 7", socket: "AM4", architecture: "Zen 2", codename: "Matisse",
      processNodeNm: 7, totalCores: 8, threads: 16, baseClockGhz: 3.6, boostClockGhz: 4.4,
      l2CacheMb: 4, l3CacheMb: 32, tdpWatts: 65,
      pcieVersion: "PCIe 4.0", pcieLanes: 24, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 3200, unlocked: true, coolerIncluded: true,
    },
  },
  {
    id: "amd-ryzen-9-3950x", slug: "amd-ryzen-9-3950x", name: "AMD Ryzen 9 3950X",
    brand: "AMD", series: "Ryzen 3000", category: "cpu", msrp: 749,
    inrPrice: null, priceConfidence: "low", availability: "discontinued",
    releaseDate: "2019-11-25",
    summary: "Sixteen cores on a mainstream socket — a configuration that had previously required a workstation platform.",
    specs: {
      segment: "Ryzen 9", socket: "AM4", architecture: "Zen 2", codename: "Matisse",
      processNodeNm: 7, totalCores: 16, threads: 32, baseClockGhz: 3.5, boostClockGhz: 4.7,
      l2CacheMb: 8, l3CacheMb: 64, tdpWatts: 105, pl2Watts: 142,
      pcieVersion: "PCIe 4.0", pcieLanes: 24, memoryType: "DDR4", memoryChannels: 2,
      maxMemorySpeedMts: 3200, unlocked: true,
    },
  },
];
