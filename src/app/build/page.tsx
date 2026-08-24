import { Suspense } from "react";
import type { Metadata } from "next";
import { BuilderView } from "@/components/builder/builder-view";
import { PRICE_CAPTURED_ON } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Build planner",
  description:
    "Plan a compatible PC build with Indian pricing. Pick a processor and every later slot filters itself to parts that will actually work.",
};

export default function BuildPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Build planner
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-secondary">
          Start with a processor. Every slot after it shows only parts that will actually
          work with what you have chosen — socket, memory generation, slot count, connector
          and power headroom are all checked as you go, so nothing gets to the cart that
          cannot be assembled.
        </p>
        <p className="text-xs text-ink-muted">
          Prices are a researched Indian-market snapshot from {PRICE_CAPTURED_ON}, not a
          live feed.
        </p>
      </header>

      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="h-96 animate-pulse rounded-xl border border-edge bg-surface-1"
          />
        }
      >
        <BuilderView />
      </Suspense>
    </div>
  );
}
