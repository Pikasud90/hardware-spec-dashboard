import type { ComponentInput } from "@/lib/validations/component";

/**
 * Mechanical hard drives.
 *
 * Still the cheapest way to hold bulk data by a wide margin — roughly a tenth
 * the cost per terabyte of NVMe — which matters a great deal in a market where
 * storage carries import duty. They are hopeless as a boot drive and excellent
 * as a media or backup volume, and the cost-per-terabyte chart is the clearest
 * place to see why both statements are true at once.
 *
 * `tbw` here is the manufacturer's annual workload rating multiplied by the
 * warranty period, so it stays comparable with the SSD figures. HDD workload
 * ratings count reads as well as writes, which SSD TBW does not.
 */
export const STORAGE_HDD: ComponentInput[] = [
  {
    id: "seagate-barracuda-1tb", slug: "seagate-barracuda-1tb", name: "Seagate BarraCuda 1TB",
    brand: "Seagate", series: "BarraCuda", category: "storage", msrp: 45,
    inrPrice: 5500, priceConfidence: "high", availability: "available",
    releaseDate: "2016-07-01",
    summary: "The standard budget desktop drive. Fine for storage, painful as a boot volume — random access is thousands of times slower than any SSD here.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 1000,
      rpm: 7200, dramCacheMb: 64, seqReadMb: 210, seqWriteMb: 210,
      randomReadIops: 100, randomWriteIops: 130, tbw: 110, warrantyYears: 2,
    },
  },
  {
    id: "seagate-barracuda-4tb", slug: "seagate-barracuda-4tb", name: "Seagate BarraCuda 4TB",
    brand: "Seagate", series: "BarraCuda", category: "storage", msrp: 90,
    inrPrice: 15699, priceConfidence: "high", availability: "available",
    releaseDate: "2017-03-01",
    summary: "Four terabytes at a fraction of NVMe cost per terabyte. Uses shingled recording, which makes sustained writes collapse once the cache fills.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 4000,
      rpm: 5400, dramCacheMb: 256, seqReadMb: 190, seqWriteMb: 190,
      randomReadIops: 80, randomWriteIops: 100, tbw: 110, warrantyYears: 2,
    },
  },
  {
    id: "seagate-barracuda-8tb", slug: "seagate-barracuda-8tb", name: "Seagate BarraCuda 8TB",
    brand: "Seagate", series: "BarraCuda", category: "storage", msrp: 150,
    inrPrice: 18000, priceConfidence: "high", availability: "available",
    releaseDate: "2018-06-01",
    summary: "Among the lowest cost per terabyte in this catalogue, and the reason mechanical drives have not gone away.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 8000,
      rpm: 5400, dramCacheMb: 256, seqReadMb: 210, seqWriteMb: 210,
      randomReadIops: 80, randomWriteIops: 100, tbw: 110, warrantyYears: 2,
    },
  },
  {
    id: "wd-blue-4tb", slug: "wd-blue-4tb", name: "WD Blue 4TB",
    brand: "Western Digital", series: "Blue", category: "storage", msrp: 85,
    inrPrice: 7500, priceConfidence: "high", availability: "available",
    releaseDate: "2019-01-01",
    summary: "Conventional recording rather than shingled, so sustained write performance holds up far better than the BarraCuda equivalent.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 4000,
      rpm: 5400, dramCacheMb: 256, seqReadMb: 180, seqWriteMb: 180,
      randomReadIops: 80, randomWriteIops: 95, tbw: 90, warrantyYears: 2,
    },
  },
  {
    id: "seagate-ironwolf-4tb", slug: "seagate-ironwolf-4tb", name: "Seagate IronWolf 4TB NAS",
    brand: "Seagate", series: "IronWolf", category: "storage", msrp: 105,
    inrPrice: 8200, priceConfidence: "high", availability: "available",
    releaseDate: "2019-05-01",
    summary: "Rated for continuous operation and vibration from neighbouring drives — the distinction that matters in a multi-bay enclosure, where desktop drives fail early.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 4000,
      rpm: 5900, dramCacheMb: 64, seqReadMb: 180, seqWriteMb: 180,
      randomReadIops: 90, randomWriteIops: 110, tbw: 540, warrantyYears: 3,
    },
  },
  {
    id: "wd-red-plus-4tb", slug: "wd-red-plus-4tb", name: "WD Red Plus 4TB NAS",
    brand: "Western Digital", series: "Red Plus", category: "storage", msrp: 120,
    inrPrice: 13000, priceConfidence: "high", availability: "available",
    releaseDate: "2020-06-01",
    summary: "The 'Plus' matters: plain Red drives use shingled recording, which behaves badly in a RAID rebuild. Red Plus does not.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 4000,
      rpm: 5400, dramCacheMb: 128, seqReadMb: 175, seqWriteMb: 175,
      randomReadIops: 85, randomWriteIops: 105, tbw: 540, warrantyYears: 3,
    },
  },
  {
    id: "seagate-ironwolf-pro-16tb", slug: "seagate-ironwolf-pro-16tb", name: "Seagate IronWolf Pro 16TB",
    brand: "Seagate", series: "IronWolf Pro", category: "storage", msrp: 320,
    inrPrice: 41000, priceConfidence: "high", availability: "available",
    releaseDate: "2021-03-01",
    summary: "7200 RPM enterprise-class NAS drive with a 300 TB annual workload rating — roughly six times a desktop drive's.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 16000,
      rpm: 7200, dramCacheMb: 256, seqReadMb: 260, seqWriteMb: 260,
      randomReadIops: 120, randomWriteIops: 150, tbw: 1500, warrantyYears: 5,
    },
  },
  {
    id: "seagate-exos-x18-12tb", slug: "seagate-exos-x18-12tb", name: "Seagate Exos X18 12TB",
    brand: "Seagate", series: "Exos", category: "storage", msrp: 280,
    inrPrice: 34485, priceConfidence: "high", availability: "available",
    releaseDate: "2021-01-01",
    summary: "A datacentre drive: helium-filled, rated for 24/7 operation at a 550 TB annual workload. Loud by desktop standards.",
    specs: {
      driveType: "HDD", formFactor: "3.5 inch", interface: "SATA III", capacityGb: 12000,
      rpm: 7200, dramCacheMb: 256, seqReadMb: 270, seqWriteMb: 270,
      randomReadIops: 170, randomWriteIops: 440, tbw: 2750, warrantyYears: 5,
    },
  },
];
