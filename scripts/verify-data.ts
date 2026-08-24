/**
 * Data + model sanity harness. Run with `npm run verify:data`.
 *
 * This is not a unit-test suite; it is a fast readout that catches the failure
 * modes that actually bite: a record that fails validation, a derived metric
 * that comes out NaN, an index that ranks obviously wrong, or a search query
 * that stops matching.
 */
import { ALL_COMPONENTS, COMPONENTS_BY_CATEGORY, SEARCH_INDEX, numericValue } from "@/lib/catalog";
import { search } from "@/lib/search";
import { getMetricHighlight } from "@/lib/hardware-math";
import { formatMetricValue, metricFor } from "@/lib/metrics";

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${label} ${detail}`);
  } else {
    console.log(`  ok    ${label}`);
  }
}

console.log(`\nCatalogue: ${ALL_COMPONENTS.length} components`);
for (const [category, list] of Object.entries(COMPONENTS_BY_CATEGORY)) {
  console.log(`  ${category.padEnd(12)} ${list.length}`);
}

console.log("\n-- no NaN or Infinity anywhere --");
const bad: string[] = [];
for (const component of ALL_COMPONENTS) {
  for (const [key, value] of Object.entries(component.values)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      bad.push(`${component.slug}.${key}=${value}`);
    }
  }
}
check("all numeric metrics finite", bad.length === 0, bad.slice(0, 5).join(", "));

console.log("\n-- unique slugs --");
const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
check("slugs unique", slugs.size === ALL_COMPONENTS.length);

function top(category: keyof typeof COMPONENTS_BY_CATEGORY, key: string, n = 5) {
  return [...COMPONENTS_BY_CATEGORY[category]]
    .sort((a, b) => (numericValue(b, key) ?? -Infinity) - (numericValue(a, key) ?? -Infinity))
    .slice(0, n)
    .map((c) => `${c.name} ${(numericValue(c, key) ?? 0).toFixed(1)}`);
}

console.log("\n-- CPU multi-thread index (top 5) --");
top("cpu", "multiThreadIndex").forEach((line) => console.log("   ", line));
console.log("-- CPU gaming index (top 5) --");
top("cpu", "gamingIndex").forEach((line) => console.log("   ", line));
console.log("-- GPU raster index (top 5) --");
top("gpu", "rasterIndex").forEach((line) => console.log("   ", line));
console.log("-- GPU perf/watt (top 5) --");
top("gpu", "perfPerWatt").forEach((line) => console.log("   ", line));

console.log("\n-- spot checks --");
const g = (slug: string) => ALL_COMPONENTS.find((c) => c.slug === slug)!;
check(
  "RTX 4090 has highest raster index",
  Math.max(...COMPONENTS_BY_CATEGORY.gpu.map((c) => numericValue(c, "rasterIndex") ?? 0)) ===
    numericValue(g("nvidia-geforce-rtx-5090"), "rasterIndex"),
  `(5090=${numericValue(g("nvidia-geforce-rtx-5090"), "rasterIndex")?.toFixed(1)})`,
);
check(
  "9800X3D beats 9700X on gaming index",
  (numericValue(g("amd-ryzen-7-9800x3d"), "gamingIndex") ?? 0) >
    (numericValue(g("amd-ryzen-7-9700x"), "gamingIndex") ?? 0),
);
check(
  "9950X beats 9800X3D on multi-thread",
  (numericValue(g("amd-ryzen-9-9950x"), "multiThreadIndex") ?? 0) >
    (numericValue(g("amd-ryzen-7-9800x3d"), "multiThreadIndex") ?? 0),
);
const ddr5_6000c30 = numericValue(g("gskill-trident-z5-neo-32gb-6000c30"), "trueLatencyNs");
const ddr5_7200c34 = numericValue(g("gskill-trident-z5-rgb-32gb-7200c34"), "trueLatencyNs");
check("DDR5-6000 CL30 = 10.0 ns", ddr5_6000c30 === 10, `got ${ddr5_6000c30}`);
// 2000*34/7200 = 9.44 ns beats 2000*30/6000 = 10.0 ns: at CL34 the extra
// 1200 MT/s more than pays for the looser timing. This is precisely the
// reordering the true-latency metric exists to surface.
check(
  "7200 CL34 has lower true latency than 6000 CL30",
  (ddr5_7200c34 ?? 99) < (ddr5_6000c30 ?? 0),
  `${ddr5_7200c34?.toFixed(2)} vs ${ddr5_6000c30}`,
);
check("DDR5-7200 CL34 ~ 9.44 ns", Math.abs((ddr5_7200c34 ?? 0) - 9.444) < 0.01);
const sata = numericValue(g("samsung-870-evo-1tb"), "interfaceUtilisationPct");
check("SATA drive is interface-bound (>90%)", (sata ?? 0) > 90, `got ${sata?.toFixed(1)}%`);
check(
  "4090 TFLOPS ~ 82.6",
  Math.abs((numericValue(g("nvidia-geforce-rtx-4090"), "theoreticalTflops") ?? 0) - 82.58) < 0.1,
);

console.log("\n-- polarity highlighting --");
const tdp = getMetricHighlight("tdpWatts", [65, 125, 170]);
check("lower TDP wins", tdp[0] === "winner" && tdp[2] === "loser", JSON.stringify(tdp));
const cores = getMetricHighlight("totalCores", [6, 12, 16]);
check("higher cores wins", cores[2] === "winner" && cores[0] === "loser", JSON.stringify(cores));
const tie = getMetricHighlight("totalCores", [8, 8, 8]);
check("all-equal is neutral", tie.every((h) => h === "neutral"));
const withNull = getMetricHighlight("tdpWatts", [null, 65, 170]);
check("null never wins or loses", withNull[0] === "neutral" && withNull[1] === "winner");

// US8: display formatting must never leak into comparison arithmetic. A 4 TB
// drive is stored, sorted and normalised as 4000; only its rendering says "4 TB".
console.log("\n-- unit normalisation --");
{
  const bigDrive = g("samsung-870-qvo-4tb");
  const smallDrive = g("samsung-980-pro-1tb");
  const big = numericValue(bigDrive, "capacityGb");
  const small = numericValue(smallDrive, "capacityGb");
  check("4TB stored in base units as 4000", big === 4000, `got ${big}`);
  check("1TB stored in base units as 1000", small === 1000, `got ${small}`);
  check("base-unit ordering is numeric, not lexical", (big ?? 0) > (small ?? 0));
  const metric = metricFor("storage", "capacityGb")!;
  check(
    "4000 GB renders as 4 TB",
    formatMetricValue(metric, big) === "4 TB",
    formatMetricValue(metric, big),
  );
  const clockMetric = metricFor("gpu", "boostClockMhz")!;
  check(
    "2520 MHz renders as 2.52 GHz",
    formatMetricValue(clockMetric, 2520) === "2.52 GHz",
    formatMetricValue(clockMetric, 2520),
  );
}

console.log("\n-- trigram search --");
const queries: Array<[string, string]> = [
  ["5800x3d", "amd-ryzen-7-5800x3d"],
  ["5800 x3d", "amd-ryzen-7-5800x3d"],
  ["rtx4090", "nvidia-geforce-rtx-4090"],
  ["ryzen 9800", "amd-ryzen-7-9800x3d"],
  ["990 pro", "samsung-990-pro-2tb"],
  ["tomahwak", "msi-mag-x670e-tomahawk"],
  ["9070xt", "amd-radeon-rx-9070-xt"],
];
const started = performance.now();
for (const [query, expectedId] of queries) {
  const hits = search(SEARCH_INDEX, query, { limit: 5 });
  const rank = hits.findIndex((h) => h.id === expectedId);
  check(
    `"${query}" finds ${expectedId}`,
    rank >= 0 && rank < 3,
    `rank=${rank} top=${hits[0]?.id ?? "none"}`,
  );
}
const elapsed = (performance.now() - started) / queries.length;
console.log(`  mean query time: ${elapsed.toFixed(3)} ms`);
check("query under 15 ms budget", elapsed < 15);

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
