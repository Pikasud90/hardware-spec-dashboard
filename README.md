# Hardware Spec Dashboard

An offline-first build planner, reference and comparison dashboard for PC hardware —
237 processors, graphics cards, memory kits, drives, motherboards and power supplies —
with **Indian market pricing**, compatibility checking, polarity-aware diffing and a
quantitative visualisation suite.

**[▶ Live demo](https://pikasud90.github.io/hardware-spec-dashboard/)** ·
[Download desktop app](https://github.com/Pikasud90/hardware-spec-dashboard/releases) ·
[Methodology](https://pikasud90.github.io/hardware-spec-dashboard/methodology/)

[![CI](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/ci.yml)
[![Pages](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/pages.yml/badge.svg)](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**No server. No database. No network requests.** The entire catalogue is compiled into
the bundle, so the app runs identically as a static site, as a local file server, or as
a native desktop application on macOS and Windows.

---

## What it does

**Fifteen years of processors, not just this year's.** Intel Celeron through Core Ultra
across every generation from 2011 Sandy Bridge onward, AMD FX through Zen 5 plus
Threadripper, and Apple M1–M4. Knowing that a 2600K sits at roughly a fifth of a modern
part's throughput is the number that makes an upgrade decision, and it is impossible to
see if the old chip is missing.

**Reference documentation in every category.** A specification table is only useful to
someone who can already decode it. Each category opens with an orientation, then
terminology (what CAS latency, TFLOPS, TBW, VRM phases and the 12 V rail actually mean),
standards tables, buying guidance, and the mistakes that cost money.

**Charts that explain themselves.** Every chart has a reading guide: what a dot is, what
height and colour encode, what the trend line means, and what conclusion you can
legitimately draw.

**A build planner that only offers parts that work.** Pick a processor and every later
slot filters itself — socket, memory generation, slot count, connectors and power headroom
are all checked as you go. Incompatible parts are hidden rather than greyed out, with a
toggle to inspect them and the exact reason each was excluded. Compatibility is
*directional*: the processor is the root of the dependency tree, so choosing a board never
prevents you from switching platform later.

**Costed insights, not platitudes.** "Faster memory helps" is useless. "G.Skill Flare X5
cuts true latency 18% for ₹1,400 more" is actionable — and so is "a PCIe 4.0 drive saves
₹11,000 with no difference you will notice outside a benchmark."

**Indian pricing throughout.** Street prices in rupees researched from Indian retailers,
with Indian digit grouping (₹1,77,500), GST extracted from the inclusive total, and a
running-cost metric for power supplies at a ₹8/kWh tariff.

**Polarity-aware comparison.** Every numeric metric declares whether higher or lower is
better, in one shared table. The lowest TDP wins for the same reason the highest core
count wins — and an exact tie is marked neutral rather than arbitrarily awarded to
whichever column happens to be first.

**Derived engineering metrics.** True memory latency, theoretical FP32 throughput,
effective memory bandwidth, interface utilisation, drive writes per day, VRM total
current, 12 V rail capacity, cache per core, and modelled performance indices — all
computed with zero-division guards that return "unknown" rather than `NaN`.

**A real analysis layer.** Efficient (Pareto) frontiers, Pearson correlation matrices,
parallel coordinates, category distributions with polarity-aware percentiles, and
ordinary-least-squares generational trends.

**Typo-tolerant search with no backend.** PostgreSQL's `pg_trgm` similarity algorithm
ported to TypeScript and run in the browser: `5800x3d`, `rtx4090` and `tomahwak` all
resolve correctly, in about 1.2 ms across the full catalogue.

### Visualisations

| Chart | Question it answers |
|---|---|
| Specification heatmap | Which component leads on which axis, at a glance |
| Radar profile | Is this part balanced or specialised |
| Metric bars | How large is each gap, in real units and percent |
| Pareto scatter | Which parts are actually worth considering |
| Correlation matrix | Which specifications move together |
| Parallel coordinates | How do designs differ across many axes at once |
| Distribution strips | Is this number remarkable for its category |
| Generational timeline | How fast is this metric improving, and who beat their generation |
| Radial gauges | Where does this value sit in the category range |
| Power breakdown | Where does this build's draw actually go |

Each one carries a **How to read** panel explaining its encodings, and a **Data** toggle
revealing the underlying numbers as a table — so nothing is ever encoded by colour alone.

Every chart ships with a legend, a plain-language caveat, and a **Data** toggle that
reveals the underlying numbers as a table — so nothing is ever encoded by colour alone.

---

## Running it

### In a browser, right now

**[pikasud90.github.io/hardware-spec-dashboard](https://pikasud90.github.io/hardware-spec-dashboard/)** —
the same static bundle the desktop apps ship, hosted on GitHub Pages.

### Desktop application

Download the installer for your platform from the
[Releases page](https://github.com/Pikasud90/hardware-spec-dashboard/releases):

| Platform | File |
|---|---|
| macOS (Apple Silicon / Intel) | `Hardware Spec Dashboard-<version>-mac-<arch>.dmg` |
| Windows (x64 / arm64) | `Hardware Spec Dashboard-<version>-win-<arch>.exe` |
| Windows (no install) | the `portable` build |

> **These builds are unsigned**, because code-signing certificates cost money and this is
> a free project. macOS will refuse the first launch: right-click the app and choose
> **Open**, then confirm. Windows SmartScreen will show "More info → Run anyway".

### Themes

Light by default with a selected dark mode and a system option. Both palettes were
stepped for their own surface and validated separately — dark is not an inversion of
light.

### As a static site

```bash
npm install
npm run build     # emits ./out — a self-contained static bundle
npm start         # serves ./out on http://127.0.0.1:4173
```

`out/` has no server requirement and can be hosted anywhere — GitHub Pages, S3, a USB
stick. `npm start` uses a dependency-free Node server included in the repo, so nothing
beyond Node itself is needed.

### Development

```bash
npm install
npm run dev       # http://localhost:3000
```

---

## Architecture

```
src/
  lib/
    validations/component.ts   Zod discriminated unions — one schema per category
    data/                      The catalogue: 237 components as typed literals
                               (+ primers.ts — the per-category documentation)
    compatibility.ts           Build rules, power estimation, costed insights
    pricing.ts                 Indian price provenance, confidence, GST
    catalog.ts                 Validates, derives, normalises, indexes for search
    hardware-math.ts           Derived formulas + modelling constants + polarity map
    stats.ts                   Normalisation, percentiles, Pearson, Pareto, histograms
    search.ts                  pg_trgm port: trigrams, Jaccard, containment
    metrics.ts                 The metric registry — single source of truth for the UI
  components/
    charts/                    Nine chart forms over one shared frame
    builder/                   Slot picker, compatibility filtering, build summary
    compare/                   Matrix, tray, category isolation, slot swapping
    catalog/                   TanStack grid and filters
electron/                      Main process + preload for the desktop builds
scripts/                       Icon generator, static server, data verification
```

Three design decisions carry most of the weight:

**The metric registry is the single source of truth.** Table columns, comparison rows,
heatmap axes, radar spokes, correlation cells and the methodology page are all generated
from one declarative table. Adding a metric makes it appear everywhere, correctly, with
its unit, formatting, polarity and description — there is no second place to update and
no way for two views to disagree.

**Values are flattened once, at load.** Each component resolves to a flat
`Record<string, MetricValue>` combining raw specs with derived metrics, so every consumer
reads metrics the same way — by key.

**Comparison happens in base units; only presentation is rescaled.** A 4 TB drive is
stored, sorted and correlated as `4000`; it merely *renders* as "4 TB". Formatting never
feeds back into arithmetic.

### Why not PostgreSQL?

The original design used Postgres with GIN trigram indexes. That is a good design for a
hosted service and incompatible with a standalone offline application, so the trigram
algorithm was ported to TypeScript instead. Over a catalogue of this size it runs in
about 1.2 ms — faster than the network round trip a database query would have needed —
with the same `similarity()` semantics and the same 0.2 default threshold.

---

## About the numbers

Specifications are manufacturer-published figures. **Performance indices are modelled
from those specifications — they are not measured benchmark results.** No software was
run and nothing was timed.

**Prices are a researched snapshot, not a live feed.** The app works offline by design, so
nothing is fetched at runtime. Every price carries a confidence level — *verified* where a
current Indian listing was found, *approximate* where retailers disagree, *volatile* where
the category is repricing fast. DDR5 is the clearest case: through the 2026 memory
shortage, listings for identical kits differ by up to four times, so all DDR5 is marked
volatile. Parts no longer sold new in India carry no price rather than a fabricated one.

The [methodology page](https://pikasud90.github.io/hardware-spec-dashboard/methodology/)
states every formula, lists every calibration constant, and includes a limitations
section that names specific known inaccuracies — for example, the graphics model places
the RTX 4090 at roughly 66% of the RTX 5090 where measured raster results generally put
it nearer 75–78%, because the model assumes performance scales with compute and
bandwidth indefinitely.

USD launch MSRP is retained purely as generational context and never feeds a value ratio,
because a US launch price says nothing about what a part costs in India today.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static export to `out/` |
| `npm start` | Serve `out/` with the bundled zero-dependency server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run verify:data` | Schema validation, NaN/Infinity sweep, polarity and search checks |
| `npm run verify` | All of the above, in order |
| `npm run electron:preview` | Build, then open in the desktop shell |
| `npm run dist:mac` / `dist:win` | Package installers for one platform |
| `npm run generate:icons` | Regenerate the app icon (pure Node, no image libraries) |

---

## Accessibility

Full keyboard operation (`⌘K` / `Ctrl+K` and `/` for search, arrow keys and `Esc` in the
palette, visible focus rings throughout, a skip link). Winners and losers carry an arrow
glyph and a screen-reader label in addition to colour. Sortable columns expose
`aria-sort`. Every chart has a table view.

The categorical palette was validated against this application's exact chart surface
rather than assumed — worst adjacent colour-blind ΔE 8.4, worst normal-vision ΔE 19.3,
all slots ≥ 3:1 contrast. Scatter plots cap categorical encoding at three series because
with all pairs on screen simultaneously the palette cannot hold those floors beyond
three; the remainder folds into a neutral "Other".

---

## Contributing

Corrections to specifications and **price updates** are especially welcome — each category
lives in its own file under `src/lib/data/`, and every record is schema-validated at build
time, so a bad edit fails loudly rather than silently rendering wrong. Compatibility rules
live in `src/lib/compatibility.ts` and are covered by regression tests. Run
`npm run verify` before opening a pull request.

## License

[MIT](LICENSE) — free to use, modify, and redistribute, including commercially.

All runtime dependencies are permissively licensed open source: Next.js, React, Tailwind
CSS, Radix UI, TanStack Table, Recharts, Zod, nuqs, cmdk, and Lucide.
