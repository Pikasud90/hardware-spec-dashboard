import type { Category } from "@/lib/validations/component";

/**
 * Reference material for each component category.
 *
 * The catalogue is full of terms that only mean something if you already know
 * them — CAS latency, TFLOPS, TBW, 12V rail, VRM phases. A specification table
 * that assumes the reader can decode it is only useful to people who did not
 * need it. This is the missing half.
 *
 * Written to be read in order or dipped into: an orientation, the vocabulary,
 * the standards tables you actually have to look up, how to choose, and the
 * mistakes that cost real money.
 */

export interface PrimerConcept {
  term: string;
  /** One-line definition, shown collapsed. */
  short: string;
  /** The part that matters, shown expanded. */
  detail: string;
}

export interface PrimerTable {
  title: string;
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface PrimerGuidance {
  heading: string;
  body: string;
}

export interface Primer {
  title: string;
  /** One-sentence framing shown under the title. */
  tagline: string;
  intro: string[];
  concepts: PrimerConcept[];
  tables: PrimerTable[];
  guidance: PrimerGuidance[];
  /** Costly, common misunderstandings. */
  pitfalls: string[];
}

const CPU_PRIMER: Primer = {
  title: "Understanding processors",
  tagline:
    "The processor decides how fast individual tasks finish, and it fixes the socket, chipset and memory generation for the rest of the build.",
  intro: [
    "A processor executes the instructions that make up every program on the machine. Its speed comes from three things multiplied together: how many instructions it can complete per clock cycle (IPC), how many cycles it runs per second (clock speed), and how many things it can do at once (cores and threads). Two chips with identical core counts and clock speeds can differ by 60% in real work if their architectures differ by a generation or two.",
    "For most desktop use, single-thread speed decides how responsive the machine feels — application launches, web browsing, and the majority of game logic run largely on one core. Multi-thread throughput decides how fast rendering, compilation, video export and simulation finish. These are different problems, and the fastest chip for one is frequently not the fastest for the other.",
    "The processor is also the most constraining choice in a build. It fixes the socket, which fixes which motherboards fit, which fixes which memory generation you can use. That is why the build planner starts here.",
  ],
  concepts: [
    {
      term: "Core vs thread",
      short: "A core is physical hardware; a thread is a queue of work it can accept.",
      detail:
        "A core is an actual execution engine on the die. Simultaneous multi-threading (Intel calls it Hyper-Threading, AMD calls it SMT) lets one core hold two threads and switch between them whenever one stalls waiting for memory. This typically adds 20–30% throughput, not 100% — the second thread fills gaps rather than doubling the hardware. A 8-core/16-thread chip is roughly 1.28 cores' worth of throughput per core, not two.",
    },
    {
      term: "P-cores and E-cores",
      short: "Intel's hybrid designs mix large fast cores with small efficient ones.",
      detail:
        "Since 12th generation, Intel desktop chips combine performance cores (wide, high-clocked, SMT-capable) with efficiency cores (smaller, slower, no SMT, but far better throughput per unit of die area and power). A Core i7-14700K's '20 cores' means 8 P-cores plus 12 E-cores — an E-core delivers roughly 60–65% of a P-core's per-clock throughput. Apple silicon uses the same idea, but its efficiency cores are proportionally much stronger.",
    },
    {
      term: "Base clock vs boost clock",
      short: "Base is guaranteed; boost is opportunistic and usually brief on all cores.",
      detail:
        "Base clock is the frequency the chip will hold indefinitely within its rated power. Boost is the maximum a favoured core reaches when thermals and power allow. The number that actually matters for rendering is the sustained all-core clock, which sits between the two and falls as core count rises — a 96-core part cannot hold anything near its single-core boost on every core at once, because the package power budget is fixed.",
    },
    {
      term: "IPC (instructions per clock)",
      short: "How much work a core does per cycle — the real measure of architecture.",
      detail:
        "IPC is why a 4.5 GHz Zen 5 core beats a 5.0 GHz Sandy Bridge core comfortably. It improves roughly 5–15% per architecture generation. When comparing chips across generations, clock speed alone is close to meaningless; a modern core at 4 GHz outperforms a 2011 core at 5 GHz by a wide margin.",
    },
    {
      term: "Cache (L1, L2, L3)",
      short: "Small fast memory close to the cores, hiding the cost of going to RAM.",
      detail:
        "Fetching from system memory takes on the order of 80–100 nanoseconds; fetching from L1 cache takes about 1. Each level is larger and slower than the one above. L3 is shared across cores and is the level that shows up on spec sheets. Games are unusually sensitive to L3 capacity because their working sets are irregular and jump around memory.",
    },
    {
      term: "3D V-Cache (X3D)",
      short: "AMD stacks extra L3 vertically on the die — a large gaming gain, no help elsewhere.",
      detail:
        "AMD's X3D parts bond an additional cache die on top of (and since Zen 5, underneath) the compute die, taking L3 from 32 MB to 96 MB or more. This produces double-digit gains in games and simulation, and essentially nothing in rendering or compilation, which stream through data too large for any cache. It is the clearest example of why one performance number cannot describe a processor.",
    },
    {
      term: "TDP, PL1, PL2 and PPT",
      short: "TDP is a cooling class, not the power the chip actually draws.",
      detail:
        "TDP describes the sustained heat a cooler must handle at base clock. Under boost, Intel parts draw up to PL2 and AMD parts up to PPT, which are frequently double the TDP figure — a '125 W' Core i9-14900K draws up to 253 W. Size coolers and power supplies against the turbo figure, never the TDP.",
    },
    {
      term: "Socket and chipset",
      short: "The socket is physical fit; the chipset decides what features are enabled.",
      detail:
        "A socket (AM5, LGA1851) is the physical and electrical interface — a chip either fits or it does not. The chipset on the board then decides how many PCIe lanes are available, whether overclocking is permitted, and how much connectivity exists. The same processor behaves differently on a B650 and an X870E board, but it will physically fit both.",
    },
    {
      term: "Memory channels",
      short: "Independent paths to RAM. More channels means more bandwidth.",
      detail:
        "Mainstream desktop processors have two memory channels. Workstation parts have four or eight, which is much of why they cost what they do. Two channels means two DIMMs is the correct configuration — a single stick halves your memory bandwidth even if the capacity is the same.",
    },
    {
      term: "Integrated graphics (iGPU)",
      short: "A GPU on the processor package. Intel 'F' parts have it disabled.",
      detail:
        "Most processors include basic graphics, enough for desktop use and video playback. AMD's G-series APUs go considerably further and can play games at 1080p without a discrete card. Intel parts ending in F, and AMD parts ending in F, have graphics fused off — cheaper, but the machine will not display anything without a graphics card fitted.",
    },
    {
      term: "Process node (nm)",
      short: "A marketing name for a manufacturing generation, not a physical measurement.",
      detail:
        "'5 nm' and '3 nm' no longer describe any physical feature on the chip. They indicate manufacturing generation, and smaller generally means better performance per watt. They are not comparable between foundries: Intel's '10 nm' is roughly equivalent to TSMC's '7 nm' in transistor density.",
    },
  ],
  tables: [
    {
      title: "Intel desktop generations",
      caption:
        "Each socket change means a new motherboard. Note that LGA1151 appears twice and is not cross-compatible between the two — 8th generation chips will not work in a 6th/7th generation board despite fitting the socket.",
      columns: ["Generation", "Codename", "Socket", "Memory", "Year"],
      rows: [
        ["2nd", "Sandy Bridge", "LGA1155", "DDR3", "2011"],
        ["3rd", "Ivy Bridge", "LGA1155", "DDR3", "2012"],
        ["4th", "Haswell", "LGA1150", "DDR3", "2013"],
        ["6th", "Skylake", "LGA1151", "DDR4", "2015"],
        ["7th", "Kaby Lake", "LGA1151", "DDR4", "2017"],
        ["8th / 9th", "Coffee Lake", "LGA1151 (v2)", "DDR4", "2017–18"],
        ["10th", "Comet Lake", "LGA1200", "DDR4", "2020"],
        ["11th", "Rocket Lake", "LGA1200", "DDR4", "2021"],
        ["12th", "Alder Lake", "LGA1700", "DDR4 or DDR5", "2021"],
        ["13th / 14th", "Raptor Lake", "LGA1700", "DDR4 or DDR5", "2022–24"],
        ["Core Ultra 200S", "Arrow Lake", "LGA1851", "DDR5", "2024"],
      ],
    },
    {
      title: "AMD desktop generations",
      caption:
        "AM4 lasted from 2017 to 2022 across five architectures — unusually long, and the main reason AM4 remains popular second-hand. AM5 is committed to at least 2027.",
      columns: ["Series", "Architecture", "Socket", "Memory", "Year"],
      rows: [
        ["FX", "Piledriver", "AM3+", "DDR3", "2012"],
        ["Ryzen 1000", "Zen", "AM4", "DDR4", "2017"],
        ["Ryzen 2000", "Zen+", "AM4", "DDR4", "2018"],
        ["Ryzen 3000", "Zen 2", "AM4", "DDR4", "2019"],
        ["Ryzen 5000", "Zen 3", "AM4", "DDR4", "2020"],
        ["Ryzen 7000", "Zen 4", "AM5", "DDR5", "2022"],
        ["Ryzen 8000G", "Zen 4 APU", "AM5", "DDR5", "2024"],
        ["Ryzen 9000", "Zen 5", "AM5", "DDR5", "2024"],
        ["Threadripper 7000", "Zen 4", "sTR5", "DDR5 (quad/octa)", "2023"],
      ],
    },
    {
      title: "Intel model number suffixes",
      columns: ["Suffix", "Meaning"],
      caption: "AMD uses X for higher clocks, X3D for stacked cache, G for strong integrated graphics, and F for graphics disabled.",
      rows: [
        ["K", "Unlocked multiplier — can be overclocked"],
        ["F", "Integrated graphics disabled — needs a graphics card"],
        ["KF", "Both: unlocked, no integrated graphics"],
        ["S", "Special edition, higher binned clocks"],
        ["T", "Power-optimised, much lower TDP"],
        ["No suffix", "Locked multiplier, integrated graphics present"],
      ],
    },
  ],
  guidance: [
    {
      heading: "If you mainly play games",
      body: "Single-thread speed and L3 cache matter far more than core count. Six to eight fast cores is the sweet spot; past that, extra cores sit idle in most titles. This is exactly the case AMD's X3D parts are built for. Spend the savings on the graphics card, which will be the limiting factor at 1440p and above.",
    },
    {
      heading: "If you render, compile or encode",
      body: "Multi-thread throughput is what you are buying, so core count and sustained all-core clock dominate. Cache matters much less. A 16-core non-X3D part will finish a render meaningfully faster than an 8-core X3D part costing the same.",
    },
    {
      heading: "If the budget is tight",
      body: "A locked six-core with no integrated graphics (Intel F-series, AMD 7500F) gives most of the gaming performance of a chip costing twice as much. Older platforms are cheaper still: an AM4 board with a Ryzen 5 5600 remains a capable machine at a fraction of current-generation pricing.",
    },
    {
      heading: "If you want no graphics card at all",
      body: "AMD's G-series APUs are the only desktop parts with integrated graphics strong enough for real gaming. The Ryzen 7 8700G will handle 1080p in most titles at reduced settings — worth considering when graphics card pricing carries heavy import margins.",
    },
  ],
  pitfalls: [
    "Buying a cooler rated to the TDP figure. A 125 W processor can draw 253 W under load; size the cooler to the turbo power, not the TDP.",
    "Assuming more cores means faster games. Beyond about eight cores, additional cores make almost no difference to frame rates and the money is better spent elsewhere.",
    "Pairing an F-suffix processor with no graphics card. The machine will not produce a display at all — this is a genuinely common and frustrating mistake.",
    "Expecting a new processor to work in an old board of the same socket. LGA1151 covers two incompatible generations, and AM5 boards often need a BIOS update before Zen 5 will POST.",
    "Comparing clock speeds across generations. A 4.0 GHz modern core substantially outperforms a 4.5 GHz core from 2013.",
  ],
};

const GPU_PRIMER: Primer = {
  title: "Understanding graphics cards",
  tagline:
    "The graphics card decides resolution and frame rate, and it is usually both the most expensive part and the one that ages fastest.",
  intro: [
    "A graphics card renders images by running the same small program across thousands of pixels at once. Where a processor has a handful of very capable cores, a graphics card has thousands of simple ones — the RTX 5090 has 21,760. That structure is why it is enormously faster at graphics and machine learning, and useless for the branching, sequential logic a processor handles.",
    "Two things bound performance: how much arithmetic the shaders can do (compute), and how fast data reaches them from memory (bandwidth). A card starved of either is limited by the scarcer one, which is why a card with impressive shader counts and a narrow memory bus disappoints at high resolution — it runs out of bandwidth before it runs out of maths.",
    "Memory capacity is a separate, harder limit. When a game needs more VRAM than the card has, performance does not degrade gracefully; it collapses, because data must be fetched across the PCIe bus instead. This is why an 8 GB card can be perfectly fast at 1080p and unusable at 4K with high textures.",
  ],
  concepts: [
    {
      term: "CUDA cores / Stream Processors / shaders",
      short: "The parallel arithmetic units. Not comparable between vendors.",
      detail:
        "All three names describe the same idea: a simple execution unit that runs one instruction across many pixels. NVIDIA calls them CUDA cores, AMD calls them Stream Processors, Intel calls them Xe vector engines. The counts are not comparable across vendors, and not even across generations of one vendor — architectures with dual-issue or doubled FP32 datapaths advertise counts that games cannot fully use.",
    },
    {
      term: "TFLOPS",
      short: "Trillions of floating-point operations per second — a theoretical ceiling.",
      detail:
        "Calculated as 2 x shaders x boost clock / 1,000,000. The factor of two counts a fused multiply-add as two operations. It is a genuine measure of peak arithmetic capability and a poor predictor of frame rate across vendors, because it says nothing about how much of that capability real workloads can reach. Comparing TFLOPS between an NVIDIA and an AMD card will mislead you.",
    },
    {
      term: "VRAM",
      short: "Dedicated memory on the card. A hard limit, not a soft one.",
      detail:
        "Holds textures, framebuffers and geometry. Exceeding it causes severe stuttering rather than a gradual slowdown. Requirements scale with resolution and texture quality: 8 GB is workable at 1080p, 12 GB is the practical minimum for 1440p with high textures, and 16 GB or more is sensible at 4K or for local AI models.",
    },
    {
      term: "Memory bus width",
      short: "How many bits move per transfer. Combined with speed, this sets bandwidth.",
      detail:
        "A 128-bit bus moves half as much per clock as a 256-bit one. Bandwidth in GB/s is (per-pin speed x bus width) / 8. Vendors have narrowed buses in recent generations and compensated with larger caches, which works well at 1080p and progressively less well as resolution rises.",
    },
    {
      term: "Infinity Cache / L2",
      short: "A large on-die cache that lets a narrow memory bus behave like a wider one.",
      detail:
        "AMD calls it Infinity Cache, NVIDIA simply enlarged L2. Either way the idea is the same: keep frequently-used data on the die so fewer requests reach the much slower external memory. It is effective, but it is a hit-rate game — as resolution rises the working set grows and the cache helps less, which is why narrow-bus cards fall off sharply at 4K.",
    },
    {
      term: "RT cores",
      short: "Fixed-function units that accelerate ray-triangle intersection tests.",
      detail:
        "Ray tracing simulates light paths rather than approximating them. Doing so in general-purpose shaders is prohibitively slow, so modern cards include dedicated intersection hardware. Cross-vendor ray-tracing performance does not follow from core counts — NVIDIA has held a substantial lead here across several generations.",
    },
    {
      term: "Tensor / matrix cores",
      short: "Matrix-multiply accelerators, used for upscaling and machine learning.",
      detail:
        "Originally for machine learning, now central to gaming through upscalers such as DLSS. They perform matrix operations at very low precision extremely quickly, which is exactly what neural networks need. Their presence is why upscaling quality differs so much between vendors.",
    },
    {
      term: "Upscaling: DLSS, FSR, XeSS",
      short: "Render at lower resolution, reconstruct to higher — a large free-looking gain.",
      detail:
        "All three render internally at a lower resolution and reconstruct the target using motion vectors and history. DLSS (NVIDIA) uses tensor hardware and generally reconstructs best; FSR (AMD) is largely hardware-agnostic and runs on almost anything; XeSS (Intel) sits between them. Frame generation goes further and synthesises intermediate frames, which raises the frame counter but not input responsiveness.",
    },
    {
      term: "TGP / board power",
      short: "Total power the card draws, and the number that sizes your power supply.",
      detail:
        "Total Graphics Power covers the whole board, not just the GPU die. Critically, cards draw very short spikes well above this figure — sometimes double, for microseconds. A power supply that cannot ride those transients will shut down under load even though the average draw is comfortably within its rating. This is what ATX 3.x compliance addresses.",
    },
    {
      term: "PCIe interface (x16, x8)",
      short: "The host connection. Lane count matters most on budget cards.",
      detail:
        "PCIe generations are backwards compatible, each roughly doubling bandwidth. A x16 Gen4 card on a Gen3 board loses a few percent. But several budget cards use only x8 lanes — on an older Gen3 board that becomes an x8 Gen3 link, which is genuinely limiting, especially when the card is also short on VRAM.",
    },
    {
      term: "Slot width and length",
      short: "Physical size. Modern high-end cards are very large.",
      detail:
        "A '3-slot' cooler blocks two expansion slots below it. Length is the more common problem: cards over 300 mm do not fit many mid-tower cases without removing drive cages. Check both against your case before ordering.",
    },
  ],
  tables: [
    {
      title: "VRAM guidance by resolution",
      caption:
        "Capacity needed for high texture settings in current titles. Textures are close to free in performance terms if they fit, and catastrophic if they do not — which is why capacity deserves more attention than it usually gets.",
      columns: ["Resolution", "Comfortable", "Minimum", "Notes"],
      rows: [
        ["1080p", "12 GB", "8 GB", "8 GB is increasingly tight in new releases"],
        ["1440p", "16 GB", "12 GB", "The most common enthusiast target"],
        ["4K", "16–24 GB", "16 GB", "Bandwidth matters as much as capacity here"],
        ["Local AI models", "24 GB+", "16 GB", "Model size is a hard capacity limit"],
      ],
    },
    {
      title: "Recent graphics architectures",
      caption:
        "Shader counts are not comparable across these rows. Architectures with dual-issue or doubled FP32 report higher counts than games can use, which is why this catalogue applies a per-architecture efficiency factor before comparing.",
      columns: ["Vendor", "Architecture", "Series", "Year", "Notable"],
      rows: [
        ["NVIDIA", "Turing", "RTX 20", "2018", "First consumer ray tracing"],
        ["NVIDIA", "Ampere", "RTX 30", "2020", "Doubled FP32; inflated shader counts"],
        ["NVIDIA", "Ada Lovelace", "RTX 40", "2022", "Large L2, frame generation"],
        ["NVIDIA", "Blackwell", "RTX 50", "2025", "GDDR7, multi-frame generation"],
        ["AMD", "RDNA 2", "RX 6000", "2020", "Introduced Infinity Cache"],
        ["AMD", "RDNA 3", "RX 7000", "2022", "Chiplet design, dual-issue shaders"],
        ["AMD", "RDNA 4", "RX 9000", "2025", "Much improved ray tracing"],
        ["Intel", "Xe-HPG", "Arc A", "2022", "First discrete Intel attempt"],
        ["Intel", "Xe2", "Arc B", "2024", "Strong value per rupee"],
      ],
    },
    {
      title: "Power connectors",
      caption: "A 12V-2x6 connector carries up to 600 W — roughly three 8-pin cables.",
      columns: ["Connector", "Delivers", "Notes"],
      rows: [
        ["PCIe 6-pin", "75 W", "Largely obsolete"],
        ["PCIe 8-pin (6+2)", "150 W", "Still the most common"],
        ["12VHPWR / 12V-2x6", "600 W", "Seat fully — partial insertion has caused melting"],
        ["PCIe slot itself", "75 W", "Included in every card's budget"],
      ],
    },
  ],
  guidance: [
    {
      heading: "Match the card to the display, not the budget",
      body: "A card far beyond what your monitor can show is wasted money. At 1080p 60 Hz almost any current mid-range card suffices; at 1440p 144 Hz the card becomes the constraint and is worth the spend. Buy the monitor and the card together in your planning.",
    },
    {
      heading: "Capacity before raw speed at the same price",
      body: "Between a slightly faster 8 GB card and a slightly slower 12 or 16 GB one at the same price, take the memory. Speed degrades gracefully as games get heavier; running out of VRAM does not.",
    },
    {
      heading: "Check physical fit before ordering",
      body: "Length against your case, slot width against your expansion needs, and connector type against your power supply. This is the most common reason a build stalls after everything has arrived.",
    },
  ],
  pitfalls: [
    "Comparing TFLOPS across vendors. The number is real but the utilisation differs enormously; it will mislead you.",
    "Buying an 8 GB card for 1440p in 2026. It will benchmark acceptably and stutter in practice as soon as textures exceed the buffer.",
    "Pairing an x8 card with an older PCIe 3.0 board. The link halves twice over and becomes a genuine bottleneck.",
    "Sizing the power supply to board power alone. Transient spikes can hit double the rated figure for microseconds and trip protection on an otherwise adequate unit.",
    "Assuming a 12VHPWR adapter is as good as a native cable. At 400 W and above, a native cable from the supply is materially safer.",
  ],
};

const RAM_PRIMER: Primer = {
  title: "Understanding memory",
  tagline:
    "Capacity decides what you can run at once; latency and bandwidth decide how fast the processor gets fed.",
  intro: [
    "System memory holds everything currently in use. Run out and the operating system falls back to the drive, which is thousands of times slower — the difference between a machine that feels fine and one that stutters constantly. Capacity is therefore the first question, and it is a threshold rather than a gradient: enough is enough, and more brings very little.",
    "Past that threshold, memory speed matters in a narrower way. The processor's cores stall whenever they wait for data, so how quickly memory answers a request affects anything with an irregular access pattern — games and simulation especially. This is where the headline MT/s number misleads people, because it is only half the equation.",
    "The other half is latency. A kit's true latency in nanoseconds is what the processor actually experiences, and it depends on both the speed and the CAS timing. A DDR5-6000 CL30 kit and a DDR5-7200 CL36 kit look very different on the box and are within a nanosecond of each other in practice.",
  ],
  concepts: [
    {
      term: "DDR (Double Data Rate)",
      short: "Memory that transfers on both the rising and falling edge of the clock.",
      detail:
        "That doubling is why the advertised MT/s figure is twice the actual bus clock — DDR5-6000 runs a 3000 MHz bus. Each DDR generation raises transfer rate and density while also raising latency in cycles, which is why a new generation is not automatically faster in every workload at launch.",
    },
    {
      term: "CAS latency (CL)",
      short: "Delay in clock cycles between requesting data and receiving it.",
      detail:
        "Meaningless on its own, because a cycle is shorter at a higher frequency. CL30 at DDR5-6000 and CL40 at DDR5-8000 are the same real delay. Always convert to nanoseconds before comparing kits.",
    },
    {
      term: "True latency (ns)",
      short: "(2000 x CL) / MT/s — the only latency figure that compares across kits.",
      detail:
        "The factor of 2000 combines the DDR halving with the conversion to nanoseconds. This is the number this catalogue sorts and compares on, and it regularly reorders kits relative to their headline speeds. It is also why good DDR4 still beats entry DDR5 on latency alone.",
    },
    {
      term: "Bandwidth",
      short: "Total data per second: MT/s x 8 bytes x channels.",
      detail:
        "Bandwidth matters for streaming workloads — video encoding, large compilations, integrated graphics — while latency matters for irregular ones. Integrated graphics are unusually bandwidth-hungry because they share system memory with the processor, which is why an APU benefits from fast memory far more than a system with a discrete card.",
    },
    {
      term: "Channels and DIMM count",
      short: "Two sticks is correct on a mainstream desktop. One stick halves bandwidth.",
      detail:
        "Mainstream processors have two memory channels. A single 32 GB stick gives the same capacity as two 16 GB sticks and half the bandwidth, which is measurably slower. Four sticks fill both channels twice, which loads the memory controller harder and frequently prevents the kit reaching its rated speed.",
    },
    {
      term: "XMP and EXPO",
      short: "Stored overclocking profiles. Memory runs at slow defaults until you enable one.",
      detail:
        "Memory ships running at a conservative JEDEC baseline — DDR5-4800 regardless of what you paid for. XMP (Intel) and EXPO (AMD) are profiles stored on the module that the BIOS can apply in one click. Not enabling it is the single most common reason a new build feels slower than expected. It is technically an overclock, and it is entirely routine.",
    },
    {
      term: "Ranks",
      short: "Independent banks on a module. Dual-rank is slightly faster but harder to clock.",
      detail:
        "A dual-rank module lets the controller interleave accesses, worth a few percent. Larger modules (32 GB and up) are usually dual-rank. The trade-off is that dual-rank kits, and four-module configurations, place more load on the controller and often will not reach the highest rated speeds.",
    },
    {
      term: "Module height",
      short: "Tall heatspreaders collide with large air coolers.",
      detail:
        "A 55 mm tall RGB kit will not clear many tower coolers over the first DIMM slot. Low-profile kits are around 32–35 mm. Check the cooler's specified memory clearance — this is a very common and very avoidable build problem.",
    },
  ],
  tables: [
    {
      title: "DDR generations",
      caption:
        "Each generation roughly doubles bandwidth and raises latency in cycles. Note that true latency has barely improved in a decade — DDR3-1600 CL9 is 11.25 ns, and a good DDR5-6000 CL30 kit is 10.0 ns.",
      columns: ["Generation", "Typical speed", "Voltage", "Typical true latency", "Era"],
      rows: [
        ["DDR3", "1333–2133 MT/s", "1.50 V", "11–13 ns", "2007–2015"],
        ["DDR4", "2133–3600 MT/s", "1.20–1.35 V", "9–13 ns", "2014–2022"],
        ["DDR5", "4800–8000 MT/s", "1.10–1.45 V", "9–16 ns", "2021–"],
      ],
    },
    {
      title: "Which speed to buy",
      caption:
        "Above these points the returns fall off sharply — a memory controller running out of its 1:1 ratio can be slower despite a higher number on the box.",
      columns: ["Platform", "Sweet spot", "Why"],
      rows: [
        ["AMD AM5 (Zen 4/5)", "DDR5-6000 CL30", "The fastest speed that holds the 1:1 controller ratio"],
        ["AMD AM4 (Zen 3)", "DDR4-3600 CL16", "1:1 with the Infinity Fabric clock"],
        ["Intel LGA1700", "DDR5-6400 CL32", "Intel's controller tolerates higher speeds well"],
        ["Intel LGA1851", "DDR5-7200+", "Arrow Lake benefits from speed more than most"],
        ["Any APU / iGPU build", "As fast as affordable", "Integrated graphics are bandwidth-starved"],
      ],
    },
    {
      title: "How much capacity",
      columns: ["Use", "Capacity"],
      caption: "Capacity is a threshold: below it the machine stutters, above it extra memory does close to nothing.",
      rows: [
        ["Office, browsing, media", "16 GB"],
        ["Gaming", "32 GB — 16 GB is now marginal in new titles"],
        ["Content creation, virtual machines", "64 GB"],
        ["Large local AI models, heavy simulation", "96–128 GB"],
      ],
    },
  ],
  guidance: [
    {
      heading: "Buy one kit, not two pairs",
      body: "Modules are tested together as a kit. Two separately-bought pairs of the same model frequently will not run at rated speed together, because they may use different memory dies. Buy the total capacity you want in a single kit.",
    },
    {
      heading: "Two sticks beats four",
      body: "For the same total capacity, two modules clock higher and stress the controller less. Only go to four if you need capacity a two-stick kit cannot provide.",
    },
    {
      heading: "Enable the profile",
      body: "After building, enter the BIOS and turn on EXPO or XMP. Without it your DDR5-6000 kit runs at 4800, and you have paid for speed you are not using.",
    },
  ],
  pitfalls: [
    "Comparing CAS latency across different speeds. CL30 at 6000 and CL40 at 8000 are the same real delay — convert to nanoseconds first.",
    "Buying a single large stick to 'upgrade later'. You lose half your memory bandwidth immediately, and mixing kits later often fails to reach rated speed anyway.",
    "Forgetting to enable XMP or EXPO. Extremely common, and it silently wastes most of what a fast kit costs.",
    "Buying a tall RGB kit alongside a large air cooler without checking clearance.",
    "Assuming a higher MT/s number is faster. Past the platform's 1:1 ratio it can genuinely be slower.",
  ],
};

const STORAGE_PRIMER: Primer = {
  title: "Understanding storage",
  tagline:
    "The jump from mechanical to solid-state transformed responsiveness. Almost every jump since has been much smaller than the marketing suggests.",
  intro: [
    "Storage holds data permanently. The single most important distinction is mechanical versus solid-state: a hard drive physically moves a head across a spinning platter, taking milliseconds; an SSD addresses flash electrically, taking microseconds. That is a difference of roughly three orders of magnitude in random access, and it is why fitting an SSD is the most transformative upgrade an old machine can receive.",
    "Beyond that, the gains compress sharply. Moving from a SATA SSD to a PCIe 4.0 NVMe drive multiplies sequential throughput more than tenfold and changes how the machine feels barely at all, because everyday work — launching applications, loading games, opening files — is dominated by small random reads at shallow queue depths, where the drives are much closer together.",
    "Which leaves capacity and endurance as the questions that usually matter more than speed. A larger drive is faster than a small one of the same model (more flash chips to interleave across), lasts longer (writes spread over more cells), and spares you the work of managing space.",
  ],
  concepts: [
    {
      term: "NVMe vs SATA vs AHCI",
      short: "NVMe is a protocol built for flash; SATA was built for spinning disks.",
      detail:
        "SATA uses AHCI, designed around mechanical drives with one command queue 32 deep. NVMe runs over PCIe with thousands of queues, each thousands deep, and far lower protocol overhead. A SATA SSD tops out near 550 MB/s because the interface does; an NVMe drive on PCIe 5.0 exceeds 14,000 MB/s. The connector shape does not tell you which: an M.2 slot may carry either.",
    },
    {
      term: "M.2 form factor and keying",
      short: "M.2 2280 means 22 mm wide, 80 mm long. The key notch decides the protocol.",
      detail:
        "Nearly all desktop NVMe drives are M.2 2280. The notch position (M-key, B-key) indicates what the slot supports. Critically, some M.2 slots are wired for SATA only, some for NVMe only, and some for both — check the motherboard manual, because a SATA M.2 drive in an NVMe-only slot simply will not appear.",
    },
    {
      term: "PCIe generations for storage",
      short: "Each generation doubles bandwidth per lane. Most drives use four lanes.",
      detail:
        "PCIe 3.0 x4 caps near 3,900 MB/s, 4.0 x4 near 7,900, 5.0 x4 near 15,700. Generations are backwards compatible: a Gen5 drive in a Gen4 slot runs at Gen4 speed. That is rarely a problem in practice, and Gen5 drives run considerably hotter, which is why several ship with substantial heatsinks.",
    },
    {
      term: "TLC vs QLC NAND",
      short: "Bits stored per flash cell. More bits means cheaper, slower and less durable.",
      detail:
        "TLC stores three bits per cell, QLC four. QLC is meaningfully cheaper per gigabyte and pays for it in sustained write speed and endurance — a QLC drive's rated TBW is often a third of a comparable TLC drive's. QLC is fine for a media library that is written once and read often; it is a poor choice for a boot drive or scratch disk.",
    },
    {
      term: "SLC cache",
      short: "A fast buffer that makes benchmarks look better than sustained reality.",
      detail:
        "Drives operate a portion of their flash in fast single-bit mode as a write buffer. Advertised write speeds are measured inside this cache. Once it fills — typically after tens of gigabytes of continuous writing — speed drops sharply, sometimes below a mechanical drive on QLC parts. Manufacturers do not publish post-cache figures, so they cannot be compared here.",
    },
    {
      term: "DRAM cache and HMB",
      short: "Onboard memory for the address map. DRAM-less drives borrow host RAM instead.",
      detail:
        "The drive keeps a map from logical to physical addresses. A DRAM cache holds it on the drive; DRAM-less drives use Host Memory Buffer, borrowing a slice of system RAM. Sequential performance is similar, but sustained random performance on full drives is noticeably worse without DRAM. It is a cost saving you feel under load, not in a benchmark.",
    },
    {
      term: "TBW and DWPD",
      short: "Endurance. TBW is total writes; DWPD normalises it per day of warranty.",
      detail:
        "Terabytes Written is the manufacturer's warranty limit. Drive Writes Per Day divides that by capacity and warranty length, making drives of different sizes comparable. For context, ordinary desktop use writes perhaps 10–30 GB a day — a 1,200 TBW drive would take decades to exhaust. Endurance only becomes a real constraint under sustained heavy writing.",
    },
    {
      term: "Interface utilisation",
      short: "How much of the link the drive actually uses. Low means the flash is the limit.",
      detail:
        "A SATA SSD at 560 MB/s uses over 90% of its interface — it is interface-bound and would be faster on a better link. A DRAM-less Gen4 drive at 5,000 MB/s uses about 63%, so a faster slot would not help it. This is a useful way to see whether paying for a newer interface would change anything for a given drive.",
    },
    {
      term: "CMR vs SMR (hard drives)",
      short: "Shingled recording packs tracks tighter and collapses under sustained writes.",
      detail:
        "Conventional recording writes tracks side by side. Shingled overlaps them like roof tiles for more capacity, but rewriting one track requires rewriting its neighbours. Sustained writes on an SMR drive can fall below 20 MB/s, and they behave badly in RAID rebuilds. Vendors have not always labelled this clearly — check before buying for a NAS.",
    },
    {
      term: "RPM (hard drives)",
      short: "Spindle speed. 7200 RPM is faster and louder than 5400.",
      detail:
        "Faster rotation shortens the wait for the right sector to arrive and raises sustained throughput. It also means more noise, heat and power. For a bulk storage or backup drive, 5400 RPM is usually the better trade; for anything actively worked on, 7200 RPM.",
    },
  ],
  tables: [
    {
      title: "Interface speed ceilings",
      caption:
        "Theoretical maximum for a four-lane connection. Real drives reach 85–95% of these at best, and only on sequential transfers.",
      columns: ["Interface", "Ceiling", "Typical use"],
      rows: [
        ["SATA III", "600 MB/s", "2.5-inch SSDs, all hard drives"],
        ["PCIe 3.0 x4", "3,900 MB/s", "Budget and older NVMe"],
        ["PCIe 4.0 x4", "7,900 MB/s", "The current mainstream"],
        ["PCIe 5.0 x4", "15,700 MB/s", "High-end NVMe; runs hot"],
      ],
    },
    {
      title: "What actually improves responsiveness",
      caption:
        "Ordered by how much difference each step makes in everyday use rather than in a benchmark.",
      columns: ["Change", "Real-world effect"],
      rows: [
        ["Hard drive to any SSD", "Transformative — the largest upgrade available"],
        ["SATA SSD to NVMe Gen3", "Noticeable in large file work, subtle otherwise"],
        ["Gen3 to Gen4 NVMe", "Barely perceptible outside benchmarks"],
        ["Gen4 to Gen5 NVMe", "Effectively imperceptible; runs considerably hotter"],
        ["DRAM-less to DRAM drive", "Noticeable once the drive is fairly full"],
        ["Small drive to large drive", "Faster and longer-lived, same model"],
      ],
    },
    {
      title: "Cost per terabyte, roughly",
      caption: "The reason mechanical drives have not disappeared. Figures are indicative Indian pricing.",
      columns: ["Type", "Approx. cost per TB", "Best for"],
      rows: [
        ["Hard drive (desktop)", "₹2,500–4,000", "Bulk media, backups"],
        ["SATA SSD", "₹9,000–11,000", "Cheap secondary volumes"],
        ["NVMe Gen3/Gen4 (QLC)", "₹12,000–15,000", "Game libraries"],
        ["NVMe Gen4 (TLC)", "₹20,000–25,000", "Boot and working drives"],
        ["NVMe Gen5", "₹21,000–30,000", "Large sequential workloads"],
      ],
    },
  ],
  guidance: [
    {
      heading: "One fast drive, one large drive",
      body: "The usual sensible arrangement: a 1–2 TB TLC NVMe drive for the operating system and anything active, plus a hard drive or large QLC drive for media and archives. This buys responsiveness where it is felt and capacity where it is cheap.",
    },
    {
      heading: "Prefer capacity over interface generation",
      body: "A 2 TB Gen4 drive is a better purchase than a 1 TB Gen5 drive at the same price for almost everyone. You will notice running out of space; you will not notice the sequential difference.",
    },
    {
      heading: "Check the M.2 slot's wiring",
      body: "Boards often share M.2 bandwidth with SATA ports or the second graphics slot — populating one can disable another. The motherboard manual has a table for this, and it is worth reading before buying a second drive.",
    },
  ],
  pitfalls: [
    "Buying a Gen5 drive for a board with no Gen5 M.2 slot. It runs at half speed and costs considerably more than the Gen4 drive that would perform identically.",
    "Choosing QLC for a boot drive or scratch disk. Sustained write performance falls off a cliff once the cache fills.",
    "Assuming sequential speed predicts responsiveness. Application launches and game loads are random reads at shallow queue depth, where drives are far closer together.",
    "Filling an SSD past about 90%. Write performance and wear levelling both degrade sharply with little free space.",
    "Buying an SMR hard drive for a NAS or RAID array. Rebuilds can take days and may fail outright.",
  ],
};

const MOTHERBOARD_PRIMER: Primer = {
  title: "Understanding motherboards",
  tagline:
    "The board rarely makes a machine faster. It decides what you can connect, how much power the processor can draw, and what you can upgrade to later.",
  intro: [
    "A motherboard connects everything and supplies clean power at the right voltages. Within a given chipset, two boards will produce nearly identical performance — the board is not where speed comes from. What it decides is capability: how many drives, how fast the memory can run, whether the processor can sustain its turbo, and whether the platform has a future.",
    "The two things worth paying for are power delivery and connectivity. A weak VRM will throttle a high-power processor under sustained load, which is a real performance loss that no amount of cooling fixes. Connectivity — M.2 slots, USB ports, network speed — is what you live with daily and cannot add later.",
    "Almost everything above that is aesthetics, audio codecs and marketing. A ₹65,000 board and a ₹20,000 board with the same chipset will game identically.",
  ],
  concepts: [
    {
      term: "Chipset",
      short: "The controller that decides how many lanes, ports and features are enabled.",
      detail:
        "The processor provides a fixed number of PCIe lanes; the chipset provides more, and decides what is enabled. Higher tiers (X870E, Z890) allow memory and CPU overclocking and provide more lanes; lower tiers (B650, B860) lock overclocking and provide fewer. The processor performs the same on both — you are buying features, not speed.",
    },
    {
      term: "VRM (voltage regulator module)",
      short: "Converts 12 V to the ~1.2 V the processor needs. Undersized ones throttle.",
      detail:
        "The VRM is a set of power stages, each rated in amps. What matters is phases multiplied by amps per phase, not the marketing phase count — a 12-phase 60 A design (720 A) outperforms a 16-phase 40 A one (640 A). A 250 W processor draws roughly 200 A sustained, so a board with 400 A of capable delivery has real headroom and one with 300 A will run hot and throttle under long all-core loads.",
    },
    {
      term: "Form factor",
      short: "Physical size: ATX, Micro-ATX, Mini-ITX.",
      detail:
        "ATX (305 x 244 mm) has the most slots and is easiest to build in. Micro-ATX is shorter with fewer expansion slots and is usually the best value. Mini-ITX is 170 x 170 mm with one expansion slot and two DIMM slots — it commands a price premium and constrains cooling, but two DIMM slots actually clock higher than four.",
    },
    {
      term: "PCIe lanes and slot sharing",
      short: "Lanes are finite. Using one thing often disables another.",
      detail:
        "A mainstream processor provides 20–24 usable lanes: 16 for graphics, four for an M.2 drive. Everything else runs through the chipset over a shared link. This is why populating the third M.2 slot may disable two SATA ports, or drop the graphics slot from x16 to x8. The board manual has a table showing exactly which; it is worth reading before planning drives.",
    },
    {
      term: "M.2 slots",
      short: "Not all are equal — check generation, lanes and shared bandwidth.",
      detail:
        "The slot nearest the processor is usually wired directly to it and is the fastest; the rest run through the chipset. Only some are PCIe 5.0. A Gen5 drive in a Gen4 slot works at Gen4 speed, which is fine — but paying the Gen5 premium for that is not.",
    },
    {
      term: "BIOS Flashback",
      short: "Updates the BIOS with no processor fitted. Genuinely important on new platforms.",
      detail:
        "A board manufactured before your processor existed may not POST with it, which is a deadlock: you need a working processor to update the BIOS, and you need the BIOS updated to use your processor. Flashback breaks the loop by updating from a USB stick with no CPU installed. On AM5 with Zen 5, or any new generation on an older chipset, this feature is worth prioritising.",
    },
    {
      term: "Memory slots and topology",
      short: "Four slots is normal; two slots clock higher.",
      detail:
        "Boards with two DIMM slots (usually Mini-ITX) route memory traces more cleanly and reach higher stable speeds than four-slot boards. If you want maximum memory speed with 32 or 64 GB, a two-slot board with a two-stick kit is genuinely the better configuration.",
    },
    {
      term: "Rear I/O",
      short: "Fixed at purchase. Count the ports you need before deciding.",
      detail:
        "USB ports, network, audio and display outputs on the back panel cannot be expanded without using a slot. Count what you actually plug in. Also check network speed — 2.5 GbE is now common and 5 GbE appears on higher tiers, though a 1 GbE port is still adequate for most Indian connections.",
    },
  ],
  tables: [
    {
      title: "AMD AM5 chipsets",
      caption: "All AM5 chipsets support memory overclocking (EXPO), which is not true on Intel's lower tiers.",
      columns: ["Chipset", "CPU overclocking", "PCIe 5.0", "Notes"],
      rows: [
        ["X870E", "Yes", "Graphics + 2x M.2", "Most lanes; USB4 mandatory"],
        ["X870", "Yes", "Graphics + 1x M.2", "Single chipset die"],
        ["B850", "Yes", "1x M.2 (graphics optional)", "The value sweet spot"],
        ["B650", "Yes", "Optional", "Widely available and cheap"],
        ["A620", "No", "No", "Entry level; limited power delivery"],
      ],
    },
    {
      title: "Intel chipsets",
      caption:
        "Only Z-series boards permit CPU overclocking, and on 12th–14th generation only Z-series allows memory overclocking too — a real limitation on B-series with a fast kit.",
      columns: ["Chipset", "CPU OC", "Memory OC", "Notes"],
      rows: [
        ["Z890 / Z790", "Yes", "Yes", "Full feature set"],
        ["B860 / B760", "No", "Yes (860) / No (760)", "Best value for locked chips"],
        ["H810 / H710", "No", "No", "Entry level, few lanes"],
        ["W790", "Yes", "Yes", "Xeon workstation platform"],
      ],
    },
    {
      title: "VRM capability against processor demand",
      caption:
        "Sustained Vcore current is roughly package watts divided by 1.25 V. Compare that against phases multiplied by amps per phase.",
      columns: ["Processor class", "Turbo power", "Approx. current", "Board wanted"],
      rows: [
        ["6-core locked", "~90 W", "~72 A", "Any board, including entry"],
        ["8-core mainstream", "~160 W", "~128 A", "Mid-range, 8+ phases"],
        ["16-core / i9", "~250 W", "~200 A", "12+ phases at 60 A or better"],
        ["Threadripper", "350 W", "~280 A", "Workstation board only"],
      ],
    },
  ],
  guidance: [
    {
      heading: "Buy the chipset, then the cheapest board that has your ports",
      body: "Decide the chipset from whether you need overclocking and PCIe 5.0, then pick the least expensive board with adequate VRM and the connectivity you actually use. Money above that buys audio codecs and lighting.",
    },
    {
      heading: "Match VRM to the processor, not the budget",
      body: "Pairing a 250 W processor with an entry board is a genuine performance loss under sustained load. Pairing a 65 W processor with a flagship board is simply wasted money.",
    },
    {
      heading: "Prioritise BIOS Flashback on a new platform",
      body: "If you are buying a current-generation processor for a chipset that launched before it, Flashback turns a potential dead build into a ten-minute detour.",
    },
  ],
  pitfalls: [
    "Assuming an expensive board makes the machine faster. Within a chipset it does not; it makes it better connected.",
    "Ignoring slot sharing. Adding a third M.2 drive can silently disable SATA ports or halve the graphics slot.",
    "Buying a B-series Intel board with a fast memory kit on 12th–14th generation. Memory overclocking is locked, so the kit runs at JEDEC speed.",
    "Overlooking the VRM on a high-core processor. It will run hot and throttle regardless of your CPU cooler.",
    "Buying a board for a processor released after it without checking BIOS Flashback support.",
  ],
};

const PSU_PRIMER: Primer = {
  title: "Understanding power supplies",
  tagline:
    "The least exciting component and the one most capable of destroying the others. Size it for transients, not averages.",
  intro: [
    "A power supply converts mains AC into the regulated DC rails the rest of the machine needs. Almost everything demanding — processor, graphics card, drives — draws from the 12 V rail, so that rail's capacity matters more than the headline wattage on the box.",
    "The most common sizing mistake is budgeting for average draw. Modern graphics cards produce very short power spikes far above their rated board power — sometimes double, for microseconds. A supply that cannot ride those out will shut the machine down under load even though its average draw sits comfortably within the rating. This is what the ATX 3.x specification exists to address, and why a 1.4x headroom factor is sensible rather than paranoid.",
    "Efficiency ratings describe waste heat and running cost, not capability. An 80 PLUS Titanium 650 W unit does not power more than a Bronze 650 W unit; it wastes less energy doing it, runs cooler and stays quieter. On typical Indian tariffs the electricity saved between tiers is a few hundred rupees a year, which rarely repays a several-thousand-rupee price difference on its own.",
  ],
  concepts: [
    {
      term: "The 12V rail",
      short: "Where nearly all the power goes. Its amperage is the real capacity figure.",
      detail:
        "Processor and graphics card both draw from 12 V. Multiply the rated amps by 12 to get the watts genuinely available to them. On a modern single-rail unit this is close to the total rating; on older multi-rail designs a meaningful share was reserved for the 3.3 V and 5 V rails, so the headline number overstated what a graphics card could actually use.",
    },
    {
      term: "80 PLUS ratings",
      short: "Certified efficiency tiers. They describe waste, not capability.",
      detail:
        "A tier certifies minimum efficiency at 20%, 50% and 100% load. Higher tiers waste less as heat, which means a quieter fan and slightly lower bills. Note that Indian mains at 230 V certifies about two points higher than the 115 V figures quoted in US reviews. Efficiency peaks around 50% load, which is another argument for headroom.",
    },
    {
      term: "ATX 3.x and transient response",
      short: "A specification for surviving the power spikes modern graphics cards produce.",
      detail:
        "ATX 3.0 requires a unit to tolerate excursions to 200% of rated power for 100 microseconds without shutting down. Older units frequently trip their own protection under these spikes, producing a shutdown that looks like a failing graphics card. If you are fitting a recent high-power card, an ATX 3.x unit removes a whole class of mystery crashes.",
    },
    {
      term: "12V-2x6 / 12VHPWR",
      short: "A single 16-pin connector carrying up to 600 W.",
      detail:
        "Replaces up to three 8-pin cables. The early 12VHPWR revision suffered melting connectors when not fully seated — the revised 12V-2x6 improves the contact design. Push it in until it clicks, and prefer a native cable from the supply over an adapter at 400 W and above, since an adapter concentrates all the current into one more marginal joint.",
    },
    {
      term: "Modularity",
      short: "Whether cables detach. Matters for airflow and building, not performance.",
      detail:
        "Non-modular units have every cable permanently attached, leaving unused ones to be stuffed somewhere. Semi-modular fixes the essential cables and detaches the rest. Fully modular detaches everything. It makes no electrical difference; it makes a considerable difference to building in a small case.",
    },
    {
      term: "EPS connectors",
      short: "8-pin CPU power. High-end boards expect two.",
      detail:
        "Separate from the PCIe cables and not interchangeable, despite fitting physically — forcing a PCIe cable into an EPS socket will damage components. Most boards work with one connected; high-end boards with heavy VRMs want both for sustained high-power loads.",
    },
    {
      term: "Sizing and headroom",
      short: "Total draw x 1.4, rounded up. Efficiency peaks near half load.",
      detail:
        "Add processor turbo power and graphics board power, allow roughly 80 W for everything else, then multiply by 1.4. This covers transients and lands the unit near its efficiency peak where the fan stays slow. Substantially oversizing is not harmful but wastes money and pushes the unit below 20% load, where efficiency falls off.",
    },
    {
      term: "SFX and SFX-L",
      short: "Smaller form factors for compact cases, at a clear price premium.",
      detail:
        "SFX is 125 x 63.5 x 100 mm against ATX's 150 x 86 x 140 mm. SFX-L is slightly deeper, allowing a larger and quieter fan. Expect to pay noticeably more per watt, and check that your case actually requires one — many small cases take standard ATX units.",
    },
  ],
  tables: [
    {
      title: "80 PLUS tiers at 230 V",
      caption:
        "Efficiency at 50% load. The annual electricity difference between Bronze and Titanium on a typical Indian tariff, at 350 W average for six hours a day, is roughly ₹250.",
      columns: ["Tier", "Efficiency at 50%", "Practical meaning"],
      rows: [
        ["80+ White", "85%", "Entry level; acceptable for low-power builds"],
        ["80+ Bronze", "88%", "Fine for mid-range machines"],
        ["80+ Gold", "92%", "The sensible default for most builds"],
        ["80+ Platinum", "94%", "Quieter and cooler; premium pricing"],
        ["80+ Titanium", "96%", "Diminishing returns on cost alone"],
      ],
    },
    {
      title: "Sizing by graphics card",
      caption:
        "Assumes a mainstream processor. Add roughly 100 W if pairing with a 250 W class processor such as an i9 or Ryzen 9.",
      columns: ["Graphics card class", "Card power", "Recommended supply"],
      rows: [
        ["Entry (RTX 4060, RX 7600)", "115–165 W", "550–650 W"],
        ["Mid-range (RTX 5070, RX 9070)", "220–250 W", "750 W"],
        ["High-end (RTX 5070 Ti, RX 9070 XT)", "300–305 W", "850 W"],
        ["Flagship (RTX 5080)", "360 W", "1000 W"],
        ["RTX 5090", "575 W", "1200–1300 W"],
      ],
    },
    {
      title: "Where the power goes",
      caption: "Approximate sustained draw. Everything except the processor and graphics card is close to a rounding error.",
      columns: ["Component", "Typical draw"],
      rows: [
        ["Graphics card", "115–575 W"],
        ["Processor (turbo)", "65–253 W"],
        ["Motherboard", "~40 W"],
        ["Memory", "~3 W per module"],
        ["NVMe drive", "~8 W"],
        ["Hard drive", "~6 W"],
        ["Fans and peripherals", "~30 W"],
      ],
    },
  ],
  guidance: [
    {
      heading: "Do not economise here",
      body: "A failing power supply can take other components with it. The gap between a reputable Gold unit and the cheapest thing at the same wattage is a few thousand rupees against a build worth a great deal more. Warranty length is the closest thing to a public statement of expected lifespan — ten years is a meaningful signal.",
    },
    {
      heading: "Size for the card you might buy next",
      body: "Power supplies outlast most other components. If a card upgrade is plausible within the unit's warranty, buying one tier up now is cheaper than replacing it later.",
    },
    {
      heading: "Prefer a native 12V-2x6 cable for high-power cards",
      body: "At 400 W and above, a native cable from the supply is materially safer than an adapter. Seat it completely — the reported failures overwhelmingly involved partially inserted connectors.",
    },
  ],
  pitfalls: [
    "Sizing to average draw. Graphics transients can hit double the rated board power for microseconds and trip an otherwise adequate unit.",
    "Assuming a higher 80 PLUS tier delivers more power. It delivers the same power with less waste heat.",
    "Daisy-chaining one PCIe cable to feed two 8-pin sockets on a high-power card. Use separate cables.",
    "Reusing an old supply with a new high-power card. Pre-ATX 3.0 units are the usual cause of shutdowns that look like a faulty graphics card.",
    "Forcing a PCIe cable into the EPS CPU socket. They fit and they are not the same, and it will damage hardware.",
  ],
};

const LAPTOP_PRIMER: Primer = {
  title: "Understanding laptops",
  tagline:
    "A laptop is a set of decisions already made for you. The class fixes the envelope; almost everything else follows from it.",
  intro: [
    "The most consequential thing about a laptop is not its processor — it is its class. A 1.2 kg ultrabook and a 2.7 kg gaming machine can carry the same chip and perform very differently, because sustained speed is limited by how much heat the chassis can shed, not by the silicon. A thin body throttles; a thick one with three fans does not.",
    "The second most consequential thing is what cannot be changed later. Memory is soldered on most thin machines, which fixes capacity for the life of the device. Storage is usually replaceable, the battery sometimes, the processor and graphics never. Buy the memory you will need in three years, because you will not be able to add it.",
    "Everything else — display, ports, keyboard, weight — is a matter of how the machine will actually be used. A brilliant specification behind a 250-nit screen you cannot read near a window is a bad purchase, and no benchmark will tell you that.",
  ],
  concepts: [
    {
      term: "Laptop classes",
      short: "Ultrabook, business, mainstream, creator, gaming, mobile workstation.",
      detail:
        "Ultrabooks prioritise weight and battery over sustained speed. Business machines add serviceability, security features and long support cycles. Mainstream is the volume consumer middle. Creator machines pair good displays with modest discrete graphics. Gaming machines trade weight and noise for cooling. Mobile workstations are gaming hardware with certified drivers for CAD and simulation, which is most of what the price premium buys.",
    },
    {
      term: "Processor suffixes: U, H, HX",
      short: "The letter sets the power budget, which matters more than the model number.",
      detail:
        "U-series run at roughly 15–28 W and suit thin machines with long battery life. H-series run at 45 W and up, for creator and gaming chassis. HX-series are desktop silicon in a laptop package, 55 W and far beyond — the fastest and the least portable. An i7-1355U and an i7-13700HX share a tier name and are entirely different classes of processor.",
    },
    {
      term: "Laptop GPU power (TGP)",
      short: "The same GPU name can differ 30% between machines. Check the wattage.",
      detail:
        "NVIDIA allows manufacturers wide latitude in how much power a laptop GPU may draw. An RTX 5070 might run at 65 W in a thin chassis or 140 W in a thick one, and the difference in frame rate is roughly 30%. Two laptops advertising the identical GPU can be very different machines, and the wattage is frequently buried in a footnote. It is the single most important laptop graphics specification.",
    },
    {
      term: "Business laptop tiers",
      short: "Each vendor runs three tiers: premium, mainstream and entry.",
      detail:
        "Lenovo: ThinkPad X1 (premium ultraportable), T-series (mainstream workhorse, more serviceable), E-series (entry, plastic). Dell: Latitude 7000 (premium), 5000 (mainstream volume), 3000 (entry). HP: EliteBook (premium), ProBook (mainstream), Essential (entry). Within a tier the three vendors are closer than enthusiasts suggest — the real differences are keyboard feel, trackpad quality and how good the local service network is.",
    },
    {
      term: "Soldered vs socketed memory",
      short: "Most thin laptops solder memory. It cannot be upgraded, ever.",
      detail:
        "Soldered LPDDR is lower power and allows a thinner body, at the cost of being permanent. SODIMM slots let you add memory later but cost thickness and battery. This is the decision most likely to be regretted: 8 GB soldered is a machine with a fixed expiry date, while 8 GB socketed is a machine with a ₹4,000 fix.",
    },
    {
      term: "Display panels",
      short: "OLED, mini-LED, IPS, TN — in descending order of quality.",
      detail:
        "OLED gives perfect blacks and excellent colour, with some risk of burn-in on static interface elements over years. Mini-LED reaches far higher brightness and is better in daylight. IPS is the consistent, affordable default. TN is the budget floor — poor viewing angles and washed-out colour — and is worth actively avoiding. Brightness matters as much as panel type: below 300 nits is hard to use near a window.",
    },
    {
      term: "Battery capacity and real life",
      short: "Watt-hours, capped near 100 Wh by airline rules.",
      detail:
        "Capacity is measured in watt-hours; most airlines cap carry-on lithium batteries at 100 Wh, which is why so many laptops sit at 99.9. Actual runtime is capacity divided by draw, and draw varies enormously — the same machine might last twelve hours reading documents and ninety minutes compiling. Manufacturer claims are measured under conditions you will never reproduce.",
    },
    {
      term: "Thunderbolt and USB-C",
      short: "All Thunderbolt ports are USB-C. Very few USB-C ports are Thunderbolt.",
      detail:
        "Thunderbolt 4 carries 40 Gbps, drives multiple displays and supports external graphics enclosures. A plain USB-C port may do none of that. If you intend to use a single-cable dock, verify the port is actually Thunderbolt — this is a common and expensive misunderstanding. AMD laptops often use USB4 instead, which is similar but not identical.",
    },
    {
      term: "vPro and business features",
      short: "Remote management for corporate IT. Irrelevant to individuals.",
      detail:
        "Intel vPro adds hardware-level remote management, letting IT departments patch and repair machines that will not boot. It carries a real price premium and does nothing for a personal buyer. Its presence on a specification sheet is a signal that the machine is aimed at fleet deployment.",
    },
    {
      term: "The refurbished market",
      short: "Business laptops depreciate hard and are built to last. Often the best value.",
      detail:
        "Corporate fleets are replaced on three-year cycles regardless of condition, which floods the Indian market with ThinkPads, Latitudes and EliteBooks at a fraction of new pricing. These were built for serviceability and spares are plentiful. A ₹20,000 refurbished EliteBook frequently outperforms a ₹35,000 new budget machine — better keyboard, better build, better screen. Check the battery, which is the one part that always degrades.",
    },
  ],
  tables: [
    {
      title: "Laptop classes at a glance",
      caption:
        "Weight and battery figures are typical rather than absolute. The pattern is the point: cooling, weight and battery trade against sustained performance.",
      columns: ["Class", "Weight", "Battery", "Sustained speed", "Best for"],
      rows: [
        ["Ultrabook", "1.0–1.4 kg", "Excellent", "Modest", "Travel, writing, meetings"],
        ["Business", "1.1–1.8 kg", "Very good", "Modest", "Corporate use, long service life"],
        ["Budget", "1.7–2.0 kg", "Fair", "Low", "Study, browsing, documents"],
        ["Mainstream", "1.4–1.8 kg", "Good", "Moderate", "General home and office use"],
        ["Creator", "1.6–2.0 kg", "Good", "High", "Photo, video, design"],
        ["Gaming", "2.2–3.6 kg", "Poor", "Very high", "Games, rendering, desktop replacement"],
        ["Mobile workstation", "1.8–2.5 kg", "Fair", "Very high", "CAD, simulation, certified software"],
      ],
    },
    {
      title: "Business line tiers by vendor",
      caption:
        "Roughly equivalent tiers across the three major business vendors. Within a tier, service network quality in your city often matters more than the specification differences.",
      columns: ["Tier", "Lenovo", "Dell", "HP"],
      rows: [
        ["Premium ultraportable", "ThinkPad X1 Carbon / X1 Nano", "Latitude 7000", "EliteBook 800/1000"],
        ["Mainstream workhorse", "ThinkPad T-series", "Latitude 5000", "EliteBook 600 / ProBook"],
        ["Entry business", "ThinkPad E-series", "Latitude 3000", "ProBook 400"],
        ["Mobile workstation", "ThinkPad P-series", "Precision", "ZBook"],
        ["Consumer premium", "Yoga / Slim", "XPS", "Spectre / Envy"],
        ["Consumer gaming", "Legion / LOQ", "Alienware / G-series", "Omen / Victus"],
      ],
    },
    {
      title: "Processor suffixes",
      caption: "The letter tells you the power budget, and the power budget tells you the class of machine.",
      columns: ["Suffix", "Power", "Typical use"],
      rows: [
        ["U", "15–28 W", "Ultrabooks and business thin-and-lights"],
        ["P", "28–45 W", "Performance thin-and-lights"],
        ["H", "45–65 W", "Creator and mainstream gaming"],
        ["HX", "55–157 W", "Desktop silicon; high-end gaming and workstations"],
        ["Apple M / M Pro / M Max", "20–80 W", "Tiering by memory bandwidth and GPU cores"],
      ],
    },
    {
      title: "Memory: what to buy",
      caption:
        "The rule is harsher than for a desktop, because on most machines you cannot change your mind later.",
      columns: ["Use", "Minimum", "Comfortable"],
      rows: [
        ["Browsing, documents, video", "8 GB", "16 GB"],
        ["Study, light multitasking", "16 GB", "16 GB"],
        ["Development, many browser tabs", "16 GB", "32 GB"],
        ["Video editing, virtual machines", "32 GB", "64 GB"],
        ["Local AI models", "32 GB", "64 GB+ unified"],
      ],
    },
  ],
  guidance: [
    {
      heading: "Decide the class before anything else",
      body: "Work out how the machine will be carried and used — daily commute, desk-bound, occasional travel — and pick the class that fits. Only then compare specifications within that class. Comparing an ultrabook to a gaming laptop on processor benchmarks answers a question nobody asked.",
    },
    {
      heading: "Buy memory for three years from now",
      body: "If memory is soldered, it is permanent. 16 GB is the sensible floor for a machine you intend to keep, and 8 GB soldered should be treated as a short-term purchase regardless of how good the rest of the specification looks.",
    },
    {
      heading: "Check the GPU wattage, not just the name",
      body: "Two laptops advertising the same RTX 5070 can differ by 30% in frame rate. The wattage figure — where the manufacturer publishes it — tells you which one you are buying.",
    },
    {
      heading: "Consider refurbished business machines",
      body: "A three-year-old ThinkPad or EliteBook at ₹20,000–35,000 frequently beats a new budget laptop on build, keyboard and display. Verify battery health and that the warranty position is clear before buying.",
    },
    {
      heading: "Do not ignore the display",
      body: "It is the part you look at for every second of use. A 250-nit TN panel undermines an otherwise good machine, and no amount of processor performance compensates.",
    },
  ],
  pitfalls: [
    "Buying 8 GB of soldered memory. It cannot be upgraded, and it is the constraint you will hit first.",
    "Assuming a laptop GPU matches its desktop namesake. It does not, and the gap widens the thinner the chassis.",
    "Comparing machines across classes on processor benchmarks alone. A gaming laptop wins and is useless to carry; that was never the question.",
    "Assuming every USB-C port is Thunderbolt. Many are not, and a dock bought on that assumption will disappoint.",
    "Trusting manufacturer battery claims. They are measured at low brightness on light workloads; halve them for realistic use.",
    "Overlooking the charger. A 240 W gaming brick weighs nearly a kilogram, which changes what 'portable' means.",
  ],
};

export const PRIMERS: Partial<Record<Category, Primer>> = {
  laptop: LAPTOP_PRIMER,
  cpu: CPU_PRIMER,
  gpu: GPU_PRIMER,
  ram: RAM_PRIMER,
  storage: STORAGE_PRIMER,
  motherboard: MOTHERBOARD_PRIMER,
  psu: PSU_PRIMER,
};
