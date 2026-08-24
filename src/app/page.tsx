import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Database, Layers, Sigma } from "lucide-react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CATALOGUE_STATS, COMPONENTS_BY_CATEGORY } from "@/lib/catalog";
import { analyticMetricsFor } from "@/lib/metrics";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/component";

const analyticMetricCount = CATEGORIES.reduce(
  (total, category) => total + analyticMetricsFor(category).length,
  0,
);

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6">
      <section className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            PC hardware, compared on the numbers that matter
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-secondary sm:text-base">
            {CATALOGUE_STATS.total} processors, graphics cards, memory kits, drives and
            motherboards with full specification sheets, derived engineering metrics, and
            polarity-aware comparison — so a lower CAS latency and a higher core count are
            both recognised as wins. Runs entirely offline.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={<Database className="size-4" aria-hidden />}
            label="Components"
            value={String(CATALOGUE_STATS.total)}
            detail={`${CATALOGUE_STATS.brands} brands`}
          />
          <StatTile
            icon={<Layers className="size-4" aria-hidden />}
            label="Categories"
            value={String(CATEGORIES.length)}
            detail="Independently schema'd"
          />
          <StatTile
            icon={<Sigma className="size-4" aria-hidden />}
            label="Analytic metrics"
            value={String(analyticMetricCount)}
            detail="Spec + derived"
          />
          <StatTile
            icon={<ArrowRight className="size-4" aria-hidden />}
            label="Search latency"
            value="~1.2 ms"
            detail="Local trigram index"
          />
        </dl>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/analytics/?category=${category}`}
              className="rounded-full border border-edge bg-surface-1 px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-accent/50 hover:text-accent-bright"
            >
              {CATEGORY_LABELS[category]} analytics
              <span className="tnum ml-1.5 text-ink-muted">
                {COMPONENTS_BY_CATEGORY[category].length}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* useSearchParams requires a Suspense boundary under static export. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView />
      </Suspense>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface-1 p-4">
      <dt className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="text-accent-bright">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2">
        <span className="tnum block text-2xl font-semibold tracking-tight text-ink">
          {value}
        </span>
        <span className="mt-0.5 block text-[11px] text-ink-muted">{detail}</span>
      </dd>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-13 animate-pulse rounded-lg border border-edge bg-surface-1" />
      <div className="h-28 animate-pulse rounded-xl border border-edge bg-surface-1" />
      <div className="h-96 animate-pulse rounded-xl border border-edge bg-surface-1" />
    </div>
  );
}
