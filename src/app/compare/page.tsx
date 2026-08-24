import { Suspense } from "react";
import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Side-by-side hardware comparison with polarity-aware diffing, normalised profiles and per-metric deltas.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Comparison
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-secondary">
          Up to four components side by side. Every numeric row is scored in the
          direction that actually means &ldquo;better&rdquo; for that metric — so the lowest
          TDP and the highest core count are both marked as wins.
        </p>
      </header>

      {/* useSearchParams needs a Suspense boundary in a static export. */}
      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="h-96 animate-pulse rounded-xl border border-edge bg-surface-1"
          />
        }
      >
        <CompareView />
      </Suspense>
    </div>
  );
}
