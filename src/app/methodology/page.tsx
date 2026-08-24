import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FunctionSquare, Ruler, Search, Scale } from "lucide-react";
import {
  CPU_ARCHITECTURE_IPC,
  GPU_ARCHITECTURE_EFFICIENCY,
  ALL_CORE_CLOCK_DECAY,
  CACHE_GAMING_WEIGHT,
  CACHE_REFERENCE_MB,
  E_CORE_CLOCK_RATIO,
  GPU_BANDWIDTH_EXPONENT,
  GPU_CACHE_HALF_SATURATION_MB,
  GPU_CACHE_MAX_UPLIFT,
  GPU_COMPUTE_EXPONENT,
  INTERFACE_CEILING_MBS,
  SMT_SCALING_GAIN,
} from "@/lib/hardware-math";
import { allDerivedMetrics } from "@/lib/metrics";
import { CATALOGUE_STATS } from "@/lib/catalog";
import { PRICE_CAPTURED_ON } from "@/lib/pricing";
import { CATEGORY_SHORT_LABELS } from "@/lib/validations/component";
import { SIMILARITY_THRESHOLD } from "@/lib/search";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Every formula, constant and modelling assumption behind the derived metrics, stated in full.",
};

const derived = allDerivedMetrics();

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Methodology
        </h1>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Every number in this application is either a published specification or a
          documented function of published specifications. This page states which is
          which, gives the formula for each derived value, lists every calibration
          constant, and is explicit about where the models are weakest.
        </p>
      </header>

      {/* The disclaimer, stated up front rather than buried */}
      <section className="rounded-xl border border-warning/40 bg-warning/8 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-warning">
          <AlertTriangle className="size-4" aria-hidden />
          These are not benchmark results
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-secondary">
          <p>
            The performance indices on this site are <strong className="text-ink">modelled
            from specification sheets</strong>. No software was run, nothing was timed, and
            no measured benchmark suite was consulted. They exist to make specification
            differences legible on a common scale, not to predict frame rates.
          </p>
          <p>
            Expect roughly <strong className="text-ink">±15%</strong> deviation from
            measured results for typical parts, and materially worse at the extremes — see
            the limitations section below, which names the specific case where the GPU
            model is known to be wrong and by how much.
          </p>
          <p>
            Everything in the <em>exact identities</em> section is different: those are
            arithmetic restatements of published figures and are correct by construction.
          </p>
        </div>
      </section>

      {/* Provenance */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <Ruler className="size-4 text-accent-bright" aria-hidden />
          Data provenance
        </h2>
        <dl className="space-y-2 text-sm leading-relaxed text-ink-secondary">
          <div>
            <dt className="font-medium text-ink">Specifications</dt>
            <dd>
              Manufacturer-published figures for reference or founders-edition parts.
              Partner cards, factory-overclocked boards and binned kits routinely differ.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Prices</dt>
            <dd>
              Researched Indian street prices in rupees, captured {PRICE_CAPTURED_ON} from
              Indian retailers and price aggregators. They were researched rather than
              converted from US MSRP, because Indian pricing diverges from a currency
              conversion by a wide and category-dependent margin once import duty, GST,
              channel structure and local demand are applied.
              <br />
              <br />
              They are a <strong className="text-ink">snapshot, not a feed</strong>. Nothing
              here fetches prices at runtime, by design — the application has to work
              offline. Every price therefore carries a confidence level:{" "}
              <em>verified</em> where a current listing was found,{" "}
              <em>approximate</em> where listings disagree materially or the closest match
              was a sibling variant, and <em>volatile</em> where the category is repricing
              fast. DDR5 is the clearest case: through the 2026 memory shortage, listings
              for nominally identical kits differ by up to four times, so every DDR5 kit
              here is marked volatile and the build planner lets you override any price
              with a real quote.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">GST</dt>
            <dd>
              Indian retail prices are quoted inclusive of 18% GST, so the build planner
              extracts the tax from the total rather than adding it on top.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Availability</dt>
            <dd>
              Parts no longer sold new in India are marked and carry no price rather than a
              fabricated one. They remain in the catalogue so you can compare against
              hardware you already own, or judge a second-hand asking price.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Coverage</dt>
            <dd>
              {CATALOGUE_STATS.total} components across {CATALOGUE_STATS.brands} brands. The
              catalogue is curated rather than exhaustive — it is chosen to span the
              interesting range of each category, not to list every SKU ever sold.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Missing values</dt>
            <dd>
              Where a manufacturer does not publish a figure it is stored as null and
              rendered as an em dash. Nulls never win, never lose, and never enter an
              average — they reduce the sample for that metric alone.
            </dd>
          </div>
        </dl>
      </section>

      {/* Polarity */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <Scale className="size-4 text-accent-bright" aria-hidden />
          Polarity
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Every numeric metric declares a direction: higher-is-better, lower-is-better, or
          neutral. One shared table drives the comparison grid, the heatmap, the radar
          chart, the rankings and the Pareto frontiers, so no two views can disagree about
          which end of a scale is good. A lower TDP wins for the same reason a higher core
          count wins — the winner is whichever end the metric&rsquo;s polarity points to.
        </p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Two rules follow from this and are worth stating: when every component shares
          the same value the row is neutral rather than awarding an arbitrary winner, and
          when only one component has a value at all there is nothing to compare, so
          again nothing is marked.
        </p>
      </section>

      {/* Normalisation */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Normalisation</h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Heatmaps, radar spokes and parallel-coordinate axes use min-max normalisation
          computed <strong className="text-ink">across the components currently on
          screen</strong>, then inverted for lower-is-better metrics so that 1 always
          means best:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-edge bg-surface-1 p-4 font-mono text-xs text-accent-bright">
{`unit = (value − min) / (max − min)
if polarity is LOWER_BETTER:  unit = 1 − unit
if max == min:                unit = 0.5   (no spread, no winner)`}
        </pre>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Because the range is recomputed per selection, the same component can appear at
          the top of one comparison and mid-pack in another. That is intended: the
          question these views answer is &ldquo;best of what is on screen&rdquo;, not
          &ldquo;best ever made&rdquo;.
        </p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          The 0–100 indices are different — those are scaled against the best component in
          the whole category, so they stay stable no matter what is selected.
        </p>
      </section>

      {/* Exact identities */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <FunctionSquare className="size-4 text-accent-bright" aria-hidden />
          Derived values
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Every computed metric in the application, with its formula. All of them return
          null rather than NaN or Infinity when an input is missing or would divide by
          zero.
        </p>
        <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-edge">
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Metric
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Applies to
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Formula
                </th>
              </tr>
            </thead>
            <tbody>
              {derived.map(({ category, metric }) => (
                <tr
                  key={`${category}-${metric.key}`}
                  className="border-b border-edge/50 last:border-0"
                >
                  <td className="px-3 py-2 align-top text-ink">{metric.label}</td>
                  <td className="px-3 py-2 align-top text-ink-muted">
                    {CATEGORY_SHORT_LABELS[category]}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-accent-bright">
                    {metric.formula ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CPU model */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          The processor model
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Three indices are produced, each a function of clock, core topology and cache.
          All are then scaled so the highest-scoring processor in the catalogue reads 100.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-edge bg-surface-1 p-4 font-mono text-xs text-accent-bright">
{`ST    = IPC_pcore × boost_GHz

cores = P × (1 + ${SMT_SCALING_GAIN} × SMT_active)
      + E × (IPC_ecore / IPC_pcore) × ${E_CORE_CLOCK_RATIO}
allCore = clamp(0.70, 0.95, 1.00 − ${ALL_CORE_CLOCK_DECAY} × ln(cores))
MT    = IPC_pcore × boost_GHz × allCore × cores

GAME  = ST × (1 + ${CACHE_GAMING_WEIGHT} × ln(1 + L3_MB / ${CACHE_REFERENCE_MB}))`}
        </pre>
        <p className="text-sm leading-relaxed text-ink-secondary">
          The {SMT_SCALING_GAIN * 100}% figure is the throughput a second thread adds on an
          SMT-capable core, and {E_CORE_CLOCK_RATIO} is the efficiency-core clock ratio on
          hybrid parts. SMT is inferred from the thread count exceeding the core count, so
          a part with SMT disabled scores as its physical cores alone.
          <br />
          <br />
          The all-core term is not a constant, because it physically cannot be: a package
          has a fixed power budget, so the more cores share it the lower the frequency each
          can hold. A six-core part sustains about 91% of its peak boost across all cores;
          a 96-core workstation part sustains closer to 77%.
        </p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          The logarithm in the gaming term encodes diminishing returns on cache: going
          from 32 MB to 96 MB matters far more than 96 MB to 192 MB. This is what lifts
          stacked-cache parts above their higher-clocked siblings.
        </p>

        <h3 className="pt-2 text-sm font-semibold text-ink">
          Relative IPC by architecture (Zen 4 P-core = 1.00)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
          <table className="w-full min-w-[420px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-edge">
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Architecture
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-ink-secondary">
                  P-core IPC
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-ink-secondary">
                  E-core IPC
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CPU_ARCHITECTURE_IPC).map(([name, value]) => (
                <tr key={name} className="border-b border-edge/50 last:border-0">
                  <td className="px-3 py-2 text-ink">{name}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-secondary">
                    {value.pCore.toFixed(2)}
                  </td>
                  <td className="tnum px-3 py-2 text-right text-ink-muted">
                    {value.eCore === 0 ? "—" : value.eCore.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GPU model */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          The graphics model
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Raw TFLOPS is not comparable across vendors. Architectures with dual-issue or
          doubled FP32 datapaths advertise throughput that games cannot fully consume, so
          a per-architecture efficiency factor is applied before anything is compared.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-edge bg-surface-1 p-4 font-mono text-xs text-accent-bright">
{`TFLOPS  = (2 × shaders × boost_MHz) / 1e6
BW_raw  = (Gbps × bus_bits) / 8
BW_eff  = BW_raw × (1 + ${GPU_CACHE_MAX_UPLIFT} × LLC / (LLC + ${GPU_CACHE_HALF_SATURATION_MB}))

RASTER  = (TFLOPS × arch_efficiency)^${GPU_COMPUTE_EXPONENT} × BW_eff^${GPU_BANDWIDTH_EXPONENT}`}
        </pre>
        <p className="text-sm leading-relaxed text-ink-secondary">
          The raster form is Cobb-Douglas rather than a sum, because a card starved of
          either compute or bandwidth is limited by whichever is scarcer; the exponents
          set how much each contributes at the margin. The cache term is saturating:
          a large last-level cache amplifies effective bandwidth substantially at first
          and then flattens.
        </p>

        <h3 className="pt-2 text-sm font-semibold text-ink">
          Realised performance per nominal TFLOP (Ada Lovelace = 1.00)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
          <table className="w-full min-w-[360px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-edge">
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Architecture
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-ink-secondary">
                  Factor
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(GPU_ARCHITECTURE_EFFICIENCY).map(([name, value]) => (
                <tr key={name} className="border-b border-edge/50 last:border-0">
                  <td className="px-3 py-2 text-ink">{name}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-secondary">
                    {value.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Storage ceilings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Host interface ceilings
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Interface utilisation is a drive&rsquo;s sequential read as a share of what its
          link can physically carry. A drive near 100% is interface-bound and would gain
          from a faster slot; one well below it is limited by its own NAND and controller.
        </p>
        <div className="overflow-x-auto rounded-xl border border-edge bg-surface-1">
          <table className="w-full min-w-[320px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-edge">
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-secondary">
                  Interface
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-ink-secondary">
                  Ceiling (MB/s)
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(INTERFACE_CEILING_MBS).map(([name, value]) => (
                <tr key={name} className="border-b border-edge/50 last:border-0">
                  <td className="px-3 py-2 text-ink">{name}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-secondary">
                    {formatNumber(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Build planner */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          The build planner
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Compatibility is treated as <strong className="text-ink">directional</strong>. The
          processor sits at the root of the dependency tree — it fixes the socket, which
          fixes the chipset family, which fixes the memory generation — so each slot is
          constrained only by the slots before it. That is why the processor picker is never
          narrowed by a board you already chose: switching platform has to remain possible,
          and the board is re-validated (and cleared, visibly) once the change lands.
        </p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Power is estimated from sustained turbo power rather than base TDP, because base
          TDP understates a modern processor under load by a wide margin:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-edge bg-surface-1 p-4 font-mono text-xs text-accent">
{`draw = CPU PL2/PPT + GPU TGP
     + 40 W board + 3 W per memory module
     + 8 W per NVMe drive (3 W SATA)
     + 30 W fans and peripherals

recommended PSU = draw × 1.4, rounded up to 50 W`}
        </pre>
        <p className="text-sm leading-relaxed text-ink-secondary">
          The 1.4× factor covers the very short power spikes modern graphics cards produce
          well above rated board power, and keeps the unit near 50–70% load where efficiency
          peaks and the fan stays slow. Cabinets, coolers and peripherals are not modelled,
          so budget for them separately.
        </p>
      </section>

      {/* Search */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <Search className="size-4 text-accent-bright" aria-hidden />
          Search
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Search is a TypeScript port of PostgreSQL&rsquo;s <code className="rounded bg-surface-2 px-1 font-mono text-[11px] text-accent-bright">pg_trgm</code>{" "}
          extension, running entirely in the browser. Strings are lowercased,
          non-alphanumeric runs become breaks, each word is padded to{" "}
          <code className="rounded bg-surface-2 px-1 font-mono text-[11px] text-accent-bright">{'"  word "'}</code>,
          and similarity is the Jaccard index over the resulting trigram sets — the same
          definition Postgres uses, with the same {SIMILARITY_THRESHOLD} default threshold.
        </p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Two additions sit on top, aimed at how people actually type part numbers:
          containment scoring so a short query is not penalised for the target having
          many unshared trigrams, and an alphanumeric-compressed pass so
          &ldquo;rtx4090&rdquo; matches &ldquo;RTX 4090&rdquo; regardless of spacing.
          Measured mean query time over the full catalogue is about 1.2 ms.
        </p>
      </section>

      {/* Limitations */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <AlertTriangle className="size-4 text-warning" aria-hidden />
          Known limitations
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-ink-secondary">
          <li>
            <strong className="text-ink">The graphics model overestimates the largest
            dies.</strong>{" "}
            It assumes performance scales with compute and bandwidth indefinitely, which
            very wide GPUs do not do — they run into scheduling, driver and CPU limits
            first. Concretely, the model places the RTX 4090 at roughly 66% of the RTX
            5090; measured raster results generally put it nearer 75–78%. Treat gaps
            between top-end cards as upper bounds on the real difference.
          </li>
          <li>
            <strong className="text-ink">Very-high-core workstation parts are still
            over-estimated.</strong>{" "}
            Even with the core-count-dependent clock term, the model places the 96-core
            Threadripper PRO 7995WX at roughly 4.3x a 16-core Ryzen 9 9950X, where measured
            rendering suites put the gap nearer 3.5x. Real chips of that size are limited by
            memory bandwidth and scheduling in ways core count and clock do not capture.
            Treat comparisons between mainstream and HEDT parts as an upper bound.
          </li>
          <li>
            <strong className="text-ink">Apple indices are cross-ISA estimates.</strong>{" "}
            Apple&rsquo;s cores are much wider than contemporary x86 and run at lower clocks, so
            placing them on a shared per-clock axis is an approximation in a way that
            comparing two x86 designs is not. The tier is meaningful; the precise number is
            less so. Apple parts are also soldered SoCs, so they never appear in the build
            planner.
          </li>
          <li>
            <strong className="text-ink">The multi-thread index ignores cache entirely.</strong>{" "}
            A stacked-cache part and its plain sibling with identical cores and clocks
            score identically for throughput. That is right for many rendering and
            compilation workloads and wrong for cache-sensitive ones.
          </li>
          <li>
            <strong className="text-ink">Sustained clocks are approximated, not
            measured.</strong>{" "}
            All-core frequency is modelled as a fixed fraction of peak boost. Real
            behaviour depends on cooling, board power delivery and the specific
            instruction mix — an AVX-512 workload will not hold the same clocks as a
            lightly threaded one.
          </li>
          <li>
            <strong className="text-ink">Ray tracing, upscaling and encoding are not
            modelled.</strong>{" "}
            RT and matrix core counts are listed as specifications but do not enter any
            index. Cross-vendor ray-tracing performance in particular does not follow from
            core counts.
          </li>
          <li>
            <strong className="text-ink">Sequential SSD figures are best-case.</strong>{" "}
            Manufacturer numbers are measured inside the SLC write cache. Sustained
            performance after that cache fills — which is where QLC drives fall apart — is
            not published consistently enough to include.
          </li>
          <li>
            <strong className="text-ink">Launch prices distort value metrics.</strong>{" "}
            Anything priced per dollar uses MSRP, so parts that launched badly and were
            later discounted look worse here than they are today, and vice versa.
          </li>
        </ul>
        <p className="pt-2 text-sm leading-relaxed text-ink-secondary">
          Every constant above lives in a single module and is exported, so any of these
          models can be recalibrated in one place and the whole application follows. See{" "}
          <Link
            href="https://github.com/Pikasud90/hardware-spec-dashboard"
            className="text-accent-bright underline underline-offset-2"
          >
            the source
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
