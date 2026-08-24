# Hardware Spec Dashboard

An offline-first build planner, reference and comparison dashboard for PC hardware and
laptops — **280 components across seven categories** — with Indian market pricing,
compatibility checking, polarity-aware diffing, per-category documentation and a
quantitative visualisation suite.

**[▶ Live demo](https://pikasud90.github.io/hardware-spec-dashboard/)** ·
[Download desktop app](https://github.com/Pikasud90/hardware-spec-dashboard/releases) ·
[Methodology](https://pikasud90.github.io/hardware-spec-dashboard/methodology/)

[![CI](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/ci.yml)
[![Pages](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/pages.yml/badge.svg)](https://github.com/Pikasud90/hardware-spec-dashboard/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**No server. No database. No network requests at runtime.** The entire catalogue is
compiled into the bundle, so the app runs identically as a static site, as a local file
server, or as a native desktop application on macOS and Windows.

---

## Table of contents

1. [Quick start on this machine](#1-quick-start-on-this-machine)
2. [Running it on a new machine](#2-running-it-on-a-new-machine)
3. [What each page does](#3-what-each-page-does)
4. [The catalogue](#4-the-catalogue)
5. [How it works](#5-how-it-works)
6. [About the numbers](#6-about-the-numbers)
7. [Editing the data](#7-editing-the-data)
8. [Command reference](#8-command-reference)
9. [Troubleshooting](#9-troubleshooting)
10. [Accessibility](#10-accessibility)
11. [Licence](#11-licence)

---

## 1. Quick start on this machine

The project folder already has `node_modules` and a built `out/`, so one command starts it:

```bash
npm start
```

Then open **http://127.0.0.1:4173**.

To stop it, press `Ctrl+C` in that terminal, or from any terminal:

```bash
pkill -f scripts/serve.mjs
```

### If you have changed the source

Rebuild first, then start:

```bash
npm run build && npm start
```

### If you want the desktop window instead of a browser tab

```bash
npm run electron:preview
```

This builds and opens the app in its own window. **No port is used** — Electron serves the
files through an internal `app://` protocol, so nothing listens on the network.

### While editing code

```bash
npm run dev
```

Opens **http://localhost:3000** with hot reload. Slower than `npm start`; only useful when
changing source.

> **Ports at a glance** — `npm start` → 4173 · `npm run dev` → 3000 · desktop app → none.
> Override with `PORT=8080 npm start`. To reach it from your phone on the same Wi-Fi:
> `HOST=0.0.0.0 npm start`.

---

## 2. Running it on a new machine

### Option A — the desktop app (no tools required)

The simplest path for anyone who is not going to edit the code. Download from the
[Releases page](https://github.com/Pikasud90/hardware-spec-dashboard/releases):

| Platform | File | How to install |
|---|---|---|
| **macOS** (Apple Silicon) | `Hardware Spec Dashboard-<version>-mac-arm64.dmg` | Open the `.dmg`, drag to Applications |
| **macOS** (Intel) | `Hardware Spec Dashboard-<version>-mac-x64.dmg` | Open the `.dmg`, drag to Applications |
| **Windows** (most PCs) | `Hardware Spec Dashboard-<version>-win-x64.exe` | Run the installer |
| **Windows** (Arm) | `Hardware Spec Dashboard-<version>-win-arm64.exe` | Run the installer |
| **Windows** (no install) | the `portable` build | Run the `.exe` directly, e.g. from a USB stick |

**These builds are unsigned**, because code-signing certificates cost money and this is a
free project. That means:

- **macOS** will refuse the first launch with "cannot be opened because the developer
  cannot be verified". **Right-click the app → Open → Open.** You only do this once.
  If macOS still blocks it, go to System Settings → Privacy & Security and click
  **Open Anyway**.
- **Windows** SmartScreen will show a blue warning. Click **More info → Run anyway**.

Once installed it opens like any other application, works entirely offline, and needs no
further setup.

### Option B — from source (macOS, Windows or Linux)

Requires **Node.js 20.9 or newer** ([nodejs.org](https://nodejs.org) — the LTS installer
is fine on both platforms). Then:

```bash
git clone https://github.com/Pikasud90/hardware-spec-dashboard.git
cd hardware-spec-dashboard
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4173**. These four commands are identical on macOS, Windows
(PowerShell or Command Prompt) and Linux.

### Option C — just use the hosted version

**[pikasud90.github.io/hardware-spec-dashboard](https://pikasud90.github.io/hardware-spec-dashboard/)**
— the same bundle the desktop apps ship, nothing to install.

### Option D — build your own installers

On the platform you want to target (Electron cannot cross-compile without extra tooling):

```bash
npm run dist:mac     # on macOS  → release/*.dmg and *.zip
npm run dist:win     # on Windows → release/*.exe
```

CI does both automatically on every version tag, which is where the Releases files come
from.

> **Why you cannot just double-click `out/index.html`.** The exported HTML references
> assets as `/_next/static/...` — with a leading slash, meaning "from the server root".
> Opened as a file there is no server root, so nothing loads and you get unstyled text.
> That is exactly what `npm start` and the desktop app's `app://` protocol handler solve.

---

## 3. What each page does

| Page | What it is for |
|---|---|
| **Catalogue** (`/`) | Browse all seven categories. Each opens with reference documentation, then a sortable, filterable grid. |
| **Build planner** (`/build`) | Pick a processor; every later slot shows only parts that will actually work. Running total in rupees, power estimate, compatibility audit and costed upgrade suggestions. |
| **Compare** (`/compare`) | Up to four components side by side with polarity-aware diffing, a normalised radar profile and a specification heatmap. |
| **Analytics** (`/analytics`) | Category-level structure: efficient frontiers, rankings, parallel coordinates, correlation matrices and generational trends. |
| **Where to buy** (`/where-to-buy`) | Indian retailers, refurbishers and physical hardware markets, with what to check at each. |
| **Methodology** (`/methodology`) | Every formula, every calibration constant, and an explicit list of where the models are known to be wrong. |
| **Component detail** (`/component/<slug>`) | Full spec sheet, derived gauges, percentile placement within its category, and nearest alternatives by price. |

Press `⌘K` (macOS) or `Ctrl+K` (Windows), or just `/`, to search from anywhere.

---

## 4. The catalogue

| Category | Count | Coverage |
|---|---:|---|
| Processors | 112 | Intel Celeron→Core Ultra across 2nd Gen Sandy Bridge (2011) to Arrow Lake, plus Xeon W; AMD FX through Zen 5 and Threadripper; Apple M1–M4 |
| Graphics cards | 31 | NVIDIA Turing→Blackwell, AMD RDNA 2–4, Intel Arc |
| Memory | 20 | DDR4 and DDR5 kits across speed and timing grades |
| Storage | 30 | NVMe Gen3/4/5, SATA SSDs, and mechanical hard drives |
| Motherboards | 20 | AM4, AM5, LGA1700, LGA1851 |
| Power supplies | 24 | 550 W Bronze to 1300 W Platinum, ATX and SFX |
| Laptops | 43 | MacBooks, ThinkPad/Latitude/EliteBook, gaming, ultrabooks, budget |

**Every category opens with reference documentation** — an orientation, terminology,
standards tables, buying guidance and the mistakes that cost money. A specification table
is only useful to someone who can already decode it; that documentation is the other half.

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
| Generational timeline | How fast is this improving, and who beat their generation |
| Radial gauges | Where does this value sit in the category range |
| Power breakdown | Where does this build's draw actually go |

Each carries a **How to read** panel explaining its encodings, and a **Data** toggle
revealing the underlying numbers as a table — so nothing is ever encoded by colour alone.

---

## 5. How it works

```
src/
  lib/
    validations/component.ts   Zod discriminated unions — one schema per category
    data/                      The catalogue: 280 components as typed literals
      primers.ts               Per-category reference documentation
      retailers.ts             Indian retailers and hardware markets
    catalog.ts                 Validates, derives, normalises, indexes for search
    hardware-math.ts           Derived formulas, modelling constants, polarity map
    compatibility.ts           Build rules, power estimation, costed insights
    stats.ts                   Normalisation, percentiles, Pearson, Pareto, histograms
    search.ts                  pg_trgm port: trigrams, Jaccard, containment
    metrics.ts                 The metric registry — single source of truth for the UI
    pricing.ts                 Indian price provenance, confidence, GST
  components/
    charts/                    Ten chart forms over one shared frame
    builder/                   Slot picker, compatibility filtering, build summary
    compare/                   Matrix, tray, category isolation, slot swapping
    catalog/                   Grid, filters, category primers
electron/                      Main process + preload for the desktop builds
scripts/                       Icon generator, static server, data verification
```

Four decisions carry most of the weight:

**The metric registry is the single source of truth.** Table columns, comparison rows,
heatmap axes, radar spokes, correlation cells and the methodology page are all generated
from one declarative table. Adding a metric makes it appear everywhere, correctly, with
its unit, formatting, polarity and description — there is no second place to update.

**Values are flattened once, at load.** Each component resolves to a flat
`Record<string, MetricValue>` combining raw specs with derived metrics, so every consumer
reads metrics the same way — by key.

**Comparison happens in base units; only presentation is rescaled.** A 4 TB drive is
stored, sorted and correlated as `4000`; it merely *renders* as "4 TB". Formatting never
feeds back into arithmetic.

**Compatibility is directional.** The processor is the root of the dependency tree — it
fixes the socket, which fixes the chipset, which fixes the memory generation — so each
slot is constrained only by the slots before it. That is why choosing a motherboard never
prevents you from switching platform afterwards; the board is re-validated and cleared,
visibly, once the change lands.

### Why not PostgreSQL?

The original design used Postgres with GIN trigram indexes. That is a good design for a
hosted service and incompatible with a standalone offline application, so the trigram
algorithm was ported to TypeScript instead. It runs in about 1 ms over the full
catalogue — faster than the network round trip a database query would have needed — with
the same `similarity()` semantics and the same 0.2 default threshold.

---

## 6. About the numbers

Specifications are manufacturer-published figures. **Performance indices are modelled from
those specifications — they are not measured benchmark results.** No software was run and
nothing was timed. The [methodology page](https://pikasud90.github.io/hardware-spec-dashboard/methodology/)
states every formula and constant, and lists the specific cases where the models are known
to be wrong.

**Prices are a researched snapshot, not a live feed.** The app works offline by design, so
nothing is fetched at runtime. Every price carries a confidence level:

- **Verified** — a current Indian listing was found
- **Approx.** — listings disagree materially, or the closest match was a sibling variant
- **Volatile** — the category is repricing fast

DDR5 is the clearest case: through the 2026 memory shortage, listings for identical kits
differ by up to four times, so all DDR5 is marked volatile and any insight resting on such
a price says so. Parts no longer sold new in India carry **no price** rather than a
fabricated one.

USD launch MSRP is retained purely as generational context and never feeds a value ratio,
because a US launch price says nothing about what a part costs in India today.

---

## 7. Editing the data

Corrections and price updates are the most useful contribution. Each category lives in its
own file under `src/lib/data/`:

| File | Contents |
|---|---|
| `cpus.ts`, `cpus-intel-legacy.ts`, `cpus-intel-modern.ts`, `cpus-amd-legacy.ts`, `cpus-amd-modern.ts`, `cpus-apple.ts` | Processors, split by vendor and era |
| `gpus.ts` | Graphics cards |
| `memory.ts` | Memory kits |
| `storage.ts`, `storage-hdd.ts` | Solid-state and mechanical drives |
| `motherboards.ts`, `psus.ts`, `laptops.ts` | Boards, power supplies, laptops |
| `primers.ts` | Per-category documentation |
| `retailers.ts` | Where-to-buy listings |

To update a price, edit `inrPrice` and set `priceConfidence` honestly. Then:

```bash
npm run verify
```

This runs the type-checker, the data and model checks, the linter and a full build. Every
record is schema-validated with cross-field rules — threads cannot be fewer than cores,
boost cannot be below base, turbo power cannot be below TDP — so a bad edit fails loudly
rather than silently rendering something wrong.

Compatibility rules live in `src/lib/compatibility.ts` and are covered by regression tests
in `scripts/verify-data.ts`.

---

## 8. Command reference

| Command | What it does |
|---|---|
| `npm start` | Serve the built `out/` on http://127.0.0.1:4173 |
| `npm run dev` | Development server with hot reload on :3000 |
| `npm run build` | Static export to `out/` |
| `npm run verify` | Type-check, data checks, lint and build — run before committing |
| `npm run typecheck` | `tsc --noEmit` only |
| `npm run lint` | ESLint only |
| `npm run verify:data` | Schema validation, NaN sweep, polarity, compatibility and search checks |
| `npm run electron:preview` | Build, then open in the desktop shell |
| `npm run electron:dev` | Desktop shell pointed at the dev server |
| `npm run dist:mac` | Package macOS installers into `release/` |
| `npm run dist:win` | Package Windows installers into `release/` |
| `npm run generate:icons` | Regenerate the app icon (pure Node, no image libraries) |
| `npm run clean` | Remove `.next`, `out` and `release` |

---

## 9. Troubleshooting

**`npm start` says "No `out` directory found".**
The app has not been built yet. Run `npm run build` first.

**Port 4173 is already in use.**
Either something is already serving (`pkill -f scripts/serve.mjs`) or another program has
the port. Use a different one: `PORT=8080 npm start`.

**The page loads but has no styling.**
Usually means `npm run build` ran while `npm run dev` was live, which corrupts the Next.js
cache. Fix with `npm run clean && npm run build`.

**macOS says the app "cannot be opened".**
The build is unsigned. Right-click the app → Open → Open. Once only.

**Windows SmartScreen blocks the installer.**
Same reason. More info → Run anyway.

**The desktop app opens a blank window.**
The renderer bundle is missing. Run `npm run build`, then `npm run electron:preview`. The
app also prints a clear message to the console in this case rather than failing silently.

**`npm ci` fails on an older Node.**
This project needs Node 20.9 or newer. Check with `node -v`.

---

## 10. Accessibility

Full keyboard operation (`⌘K` / `Ctrl+K` and `/` for search, arrow keys and `Esc` in the
palette, visible focus rings throughout, a skip link). Winners and losers carry an arrow
glyph and a screen-reader label in addition to colour. Sortable columns expose `aria-sort`.
Every chart has a table view.

Light and dark themes were each stepped for their own surface and validated separately —
dark is not an inversion of light. Worst adjacent colour-blind ΔE 9.1 light / 8.4 dark;
worst normal-vision ΔE 19.6 / 19.3. Scatter plots cap categorical encoding at three series
because with all pairs on screen simultaneously the palette cannot hold those floors
beyond three; the remainder folds into a neutral "Other".

---

## 11. Licence

[MIT](LICENSE) — free to use, modify, and redistribute, including commercially.

All runtime dependencies are permissively licensed open source: Next.js, React, Tailwind
CSS, Radix UI, TanStack Table, Recharts, Zod, nuqs, cmdk, and Lucide.
