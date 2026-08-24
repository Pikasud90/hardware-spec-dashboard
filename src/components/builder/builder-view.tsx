"use client";

import * as React from "react";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { Check, ChevronRight, Cpu, Lock, RotateCcw, Share2, Sparkles, TriangleAlert, X } from "lucide-react";
import { COMPONENTS_BY_CATEGORY, COMPONENT_BY_ID, type ResolvedComponent } from "@/lib/catalog";
import {
  SLOT_CATEGORY, SLOT_LABELS, SLOT_ORDER, filterCompatible, revalidateDownstream, upstreamOf,
  type BuildSelection, type BuildSlot,
} from "@/lib/compatibility";
import { SlotPicker } from "@/components/builder/slot-picker";
import { BuildSummary } from "@/components/builder/build-summary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceConfidenceBadge } from "@/components/ui/price-badge";
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The build planner.
 *
 * The whole interaction is built around one rule the user asked for: choose a
 * processor first, and every subsequent slot only offers parts that will
 * actually work with it. Slots downstream of an empty processor are locked
 * rather than merely unhelpful, because presenting 148 parts and letting
 * someone discover the incompatibility at checkout is the problem being fixed.
 *
 * Selection lives entirely in the URL, so a build is a link you can send to
 * someone or paste into a forum thread for a second opinion.
 */

/** Starting points, so the planner is not a blank page. */
const PRESETS: Array<{
  name: string;
  budget: string;
  note: string;
  parts: Partial<Record<BuildSlot, string>>;
}> = [
  {
    name: "1080p value build",
    budget: "≈ ₹85,000",
    note: "Six modern cores and a card sized for high-refresh 1080p, with nothing overspent on the board.",
    parts: {
      cpu: "amd-ryzen-5-9600x",
      motherboard: "asrock-b650m-pro-rs",
      ram: "kingston-fury-beast-32gb-6000c36",
      gpu: "nvidia-geforce-rtx-4060",
      storage: "crucial-p3-plus-2tb",
      psu: "ant-esports-fg650-v2",
    },
  },
  {
    name: "1440p gaming",
    budget: "≈ ₹1,85,000",
    note: "The stacked-cache processor most gaming builds are measured against, paired with a 16 GB card.",
    parts: {
      cpu: "amd-ryzen-7-9800x3d",
      motherboard: "gigabyte-b650-aorus-elite-ax",
      ram: "gskill-flare-x5-32gb-6000c30",
      gpu: "amd-radeon-rx-9070-xt",
      storage: "wd-black-sn850x-2tb",
      psu: "msi-mag-a850gl-pcie5",
    },
  },
  {
    name: "Content workstation",
    budget: "≈ ₹3,20,000",
    note: "Sixteen cores for rendering and compilation, 96 GB of memory, and storage endurance to match.",
    parts: {
      cpu: "amd-ryzen-9-9950x",
      motherboard: "msi-mag-x670e-tomahawk",
      ram: "corsair-vengeance-96gb-6600c32",
      gpu: "nvidia-geforce-rtx-4070-ti-super",
      storage: "samsung-990-pro-4tb",
      psu: "corsair-rm1000x",
    },
  },
];

export function BuilderView() {
  const [params, setParams] = useQueryStates(
    Object.fromEntries(SLOT_ORDER.map((slot) => [slot, parseAsString])) as Record<
      BuildSlot,
      typeof parseAsString
    >,
  );

  const [openSlot, setOpenSlot] = React.useState<BuildSlot | null>(null);
  const [copied, setCopied] = React.useState(false);
  /** Slots emptied by the most recent change, so the UI can explain itself. */
  const [cleared, setCleared] = React.useState<BuildSlot[]>([]);

  /** Resolve URL ids into components, dropping anything unrecognised (US5). */
  const build = React.useMemo<BuildSelection>(() => {
    const next: BuildSelection = {};
    for (const slot of SLOT_ORDER) {
      const id = params[slot];
      if (!id) continue;
      const component = COMPONENT_BY_ID.get(id);
      if (component && component.category === SLOT_CATEGORY[slot]) next[slot] = component;
    }
    return next;
  }, [params]);

  const setSlot = React.useCallback(
    (slot: BuildSlot, component: ResolvedComponent | null) => {
      void setParams((current) => {
        // Resolve the whole build with the change applied, then drop any later
        // part the change invalidated — a silent conflict is worse than a
        // cleared slot the user can see.
        const proposed: BuildSelection = {};
        for (const other of SLOT_ORDER) {
          if (other === slot) {
            if (component) proposed[other] = component;
            continue;
          }
          const id = current[other];
          const existing = id ? COMPONENT_BY_ID.get(id) : undefined;
          if (existing) proposed[other] = existing;
        }

        const { build: settled, cleared } = revalidateDownstream(slot, proposed);
        if (cleared.length > 0) setCleared(cleared);

        return Object.fromEntries(
          SLOT_ORDER.map((s) => [s, settled[s]?.id ?? null]),
        ) as Record<BuildSlot, string | null>;
      });
    },
    [setParams],
  );

  const applyPreset = React.useCallback(
    (parts: Partial<Record<BuildSlot, string>>) => {
      void setParams(
        Object.fromEntries(
          SLOT_ORDER.map((slot) => [slot, parts[slot] ?? null]),
        ) as Record<BuildSlot, string | null>,
      );
    },
    [setParams],
  );

  const reset = React.useCallback(() => {
    void setParams(
      Object.fromEntries(SLOT_ORDER.map((slot) => [slot, null])) as Record<
        BuildSlot,
        string | null
      >,
    );
  }, [setParams]);

  const share = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the URL is visible in the bar regardless.
    }
  }, []);

  /** Counts drive the "N compatible" badge on each unfilled slot. */
  const availability = React.useMemo(() => {
    const result = {} as Record<BuildSlot, number>;
    for (const slot of SLOT_ORDER) {
      result[slot] = filterCompatible(
        COMPONENTS_BY_CATEGORY[SLOT_CATEGORY[slot]],
        slot,
        upstreamOf(slot, build),
      ).compatible.length;
    }
    return result;
  }, [build]);

  const filled = SLOT_ORDER.filter((slot) => build[slot]).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {filled === 0 && (
          <section className="rounded-xl border border-edge bg-surface-1 p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Sparkles className="size-4 text-accent-strong" aria-hidden />
              Start from a proven build
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Or pick a processor below and work down — every later slot filters itself to
              match.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.parts)}
                  className="group rounded-lg border border-edge bg-surface-2/50 p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-2"
                >
                  <p className="text-xs font-semibold text-ink group-hover:text-accent-strong">
                    {preset.name}
                  </p>
                  <p className="tnum mt-0.5 text-[11px] text-ink-secondary">{preset.budget}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                    {preset.note}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {cleared.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="flex-1 leading-relaxed">
              <span className="font-medium">
                {cleared.length === 1 ? "One slot was cleared. " : `${cleared.length} slots were cleared. `}
              </span>
              {cleared.map((s) => SLOT_LABELS[s].toLowerCase()).join(", ")} no longer
              {cleared.length === 1 ? " fits" : " fit"} the parts you now have selected, so
              {cleared.length === 1 ? " it was" : " they were"} removed rather than left in
              conflict.
            </p>
            <button
              type="button"
              onClick={() => setCleared([])}
              aria-label="Dismiss"
              className="rounded p-0.5 hover:bg-warning/20"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          {/* ---- slots ---- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">
                {filled} of {SLOT_ORDER.length} slots filled
              </p>
              {filled > 0 && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={share}>
                    {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
                    {copied ? "Link copied" : "Share build"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RotateCcw aria-hidden />
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {SLOT_ORDER.map((slot, index) => {
              const component = build[slot];
              // Everything downstream of the processor stays locked until one
              // is chosen — that is the constraint the planner exists to apply.
              const locked = slot !== "cpu" && !build.cpu;
              const count = availability[slot];

              return (
                <div
                  key={slot}
                  className={cn(
                    "rounded-xl border bg-surface-1 transition-colors",
                    component ? "border-edge-strong" : "border-dashed border-edge",
                    locked && "opacity-55",
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <span className="tnum grid size-7 shrink-0 place-items-center rounded-md border border-edge bg-surface-2 text-[11px] text-ink-muted">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-muted">
                        {slot === "cpu" && <Cpu className="size-3" aria-hidden />}
                        {SLOT_LABELS[slot]}
                        {slot === "cpu" && !component && (
                          <Badge variant="accent" className="ml-1">
                            start here
                          </Badge>
                        )}
                      </p>
                      {component ? (
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/component/${component.slug}/`}
                            className="truncate text-sm font-medium text-ink transition-colors hover:text-accent-strong"
                          >
                            {component.name}
                          </Link>
                          <PriceConfidenceBadge component={component} />
                        </div>
                      ) : locked ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                          <Lock className="size-3" aria-hidden />
                          Choose a processor first
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-ink-muted">
                          Not chosen —{" "}
                          <span className="text-ink-secondary">{count} compatible</span>
                        </p>
                      )}
                    </div>

                    {component && (
                      <span className="tnum shrink-0 text-sm font-semibold text-ink">
                        {formatInr(component.inrPrice)}
                      </span>
                    )}

                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant={component ? "outline" : "secondary"}
                        size="sm"
                        disabled={locked}
                        onClick={() => setOpenSlot(slot)}
                      >
                        {component ? "Change" : "Choose"}
                        <ChevronRight aria-hidden />
                      </Button>
                      {component && (
                        <Tooltip content={`Remove ${SLOT_LABELS[slot].toLowerCase()}`}>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Remove ${component.name}`}
                            onClick={() => setSlot(slot, null)}
                          >
                            <X aria-hidden />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---- verdict ---- */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <BuildSummary build={build} onApply={(slot, component) => setSlot(slot, component)} />
          </aside>
        </div>

        {openSlot && (
          <SlotPicker
            slot={openSlot}
            build={build}
            open={openSlot !== null}
            onOpenChange={(next) => {
              if (!next) setOpenSlot(null);
            }}
            onSelect={(component) => setSlot(openSlot, component)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
