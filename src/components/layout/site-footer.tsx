import Link from "next/link";
import { CATALOGUE_STATS } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="border-t border-edge bg-surface-1/40">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 text-xs text-ink-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-ink-secondary">Hardware Spec Dashboard</p>
          <p>
            {CATALOGUE_STATS.total} components from {CATALOGUE_STATS.brands} brands. Runs
            entirely offline — no server, no telemetry, no network requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/methodology/" className="transition-colors hover:text-ink">
            Methodology
          </Link>
          <Link href="/analytics/" className="transition-colors hover:text-ink">
            Analytics
          </Link>
          <a
            href="https://github.com/Pikasud90/hardware-spec-dashboard"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-ink"
          >
            Source (MIT)
          </a>
        </div>
      </div>
      <div className="border-t border-edge/60 px-4 py-3 sm:px-6">
        <p className="mx-auto max-w-[1600px] text-[11px] leading-relaxed text-ink-muted">
          Specifications are manufacturer-published figures. Performance indices are
          modelled from those specifications using the documented formulas on the
          methodology page — they are estimates, not measured benchmark results. Prices
          are launch MSRP in USD and are not live retail pricing.
        </p>
      </div>
    </footer>
  );
}
