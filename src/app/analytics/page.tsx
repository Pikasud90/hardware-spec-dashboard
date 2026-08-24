import { Suspense } from "react";
import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Category-level hardware analysis: efficient frontiers, specification correlations, parallel coordinates and generational trends.",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Analytics
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-secondary">
          Structure rather than rankings. Which parts sit on the efficient frontier, which
          specifications actually move together, how much of a component&rsquo;s standing is
          explained by when it launched, and which designs are balanced rather than
          specialised.
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
        <AnalyticsView />
      </Suspense>
    </div>
  );
}
