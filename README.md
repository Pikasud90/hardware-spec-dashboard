# Hardware Spec Dashboard

An offline-first specification and comparison dashboard for PC hardware — processors,
graphics cards, memory, storage and motherboards — with polarity-aware diffing, derived
engineering metrics, and a quantitative visualisation suite.

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

**Polarity-aware comparison.** Every numeric metric declares whether higher or lower is
better, in one shared table. The lowest TDP wins for the same reason the highest core
count wins — and an exact tie is marked neutral rather than arbitrarily awarded to
whichever column happens to be first.

**Derived engineering metrics.** True memory latency, theoretical FP32 throughput,
effective memory bandwidth, interface utilisation, drive writes per day, VRM total
current, cache per core, and modelled performance indices — all computed with
zero-division guards that return "unknown" rather than `NaN`.

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
    data/                      The catalogue: 124 components as typed literals
    catalog.ts                 Validates, derives, normalises, indexes for search
    hardware-math.ts           Derived formulas + modelling constants + polarity map
    stats.ts                   Normalisation, percentiles, Pearson, Pareto, histograms
    search.ts                  pg_trgm port: trigrams, Jaccard, containment
    metrics.ts                 The metric registry — single source of truth for the UI
  components/
    charts/                    Nine chart forms over one shared frame
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

The [methodology page](https://pikasud90.github.io/hardware-spec-dashboard/methodology/)
states every formula, lists every calibration constant, and includes a limitations
section that names specific known inaccuracies — for example, the graphics model places
the RTX 4090 at roughly 66% of the RTX 5090 where measured raster results generally put
it nearer 75–78%, because the model assumes performance scales with compute and
bandwidth indefinitely.

Prices are launch MSRP in USD, used as a stable reference axis for value charts. They
are not live retail pricing.

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

Corrections to specifications are especially welcome — each category lives in its own
file under `src/lib/data/`, and every record is schema-validated at build time, so a bad
edit fails loudly rather than silently rendering wrong. Run `npm run verify` before
opening a pull request.

## License

[MIT](LICENSE) — free to use, modify, and redistribute, including commercially.

All runtime dependencies are permissively licensed open source: Next.js, React, Tailwind
CSS, Radix UI, TanStack Table, Recharts, Zod, nuqs, cmdk, and Lucide.
