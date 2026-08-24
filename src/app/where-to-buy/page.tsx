import type { Metadata } from "next";
import {
  Building2, ExternalLink, MapPin, RefreshCcw, ShieldCheck, ShoppingCart, Store, TriangleAlert,
} from "lucide-react";
import {
  HARDWARE_MARKETS, RETAILERS, type RetailerKind,
} from "@/lib/data/retailers";
import { Badge } from "@/components/ui/badge";
import { PRICE_CAPTURED_ON } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Where to buy",
  description:
    "Indian retailers, marketplaces, refurbishers and physical hardware markets for PC components and laptops.",
};

const KIND_META: Record<RetailerKind, { label: string; icon: typeof Store; blurb: string }> = {
  specialist: {
    label: "Component specialists",
    icon: Store,
    blurb:
      "Dedicated hardware retailers. Almost always cheaper than the marketplaces on components, with deeper catalogues — but returns are less forgiving, so confirm stock and warranty terms first.",
  },
  marketplace: {
    label: "Marketplaces",
    icon: ShoppingCart,
    blurb:
      "Widest reach and the easiest returns, at a price premium on components. The seller behind a listing matters as much as the listing itself.",
  },
  refurbished: {
    label: "Refurbished and renewed",
    icon: RefreshCcw,
    blurb:
      "Substantially cheaper, especially for complete laptops. A dedicated refurbisher with its own grading process is generally safer than a pass-through marketplace listing.",
  },
  market: { label: "Markets", icon: MapPin, blurb: "" },
};

const ORDER: RetailerKind[] = ["specialist", "marketplace", "refurbished"];

export default function WhereToBuyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Where to buy in India
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-secondary">
          Retailers, marketplaces, refurbishers and physical markets for PC components and
          laptops, with the specific thing worth checking at each before you commit money.
        </p>
        <div className="flex items-start gap-2 rounded-lg border border-edge bg-surface-1 px-4 py-3 text-xs leading-relaxed text-ink-muted">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p>
            <span className="font-medium text-ink-secondary">No star ratings here, deliberately.</span>{" "}
            Seller ratings change constantly and cannot be verified from inside an offline
            application — a stale number presented as current is worse than none when you
            are about to spend a lakh. What is listed is checkable: catalogue, stock
            condition, physical presence, and the known failure mode. Verify current
            standing yourself before ordering. Reference snapshot: {PRICE_CAPTURED_ON}.
          </p>
        </div>
      </header>

      {ORDER.map((kind) => {
        const meta = KIND_META[kind];
        const Icon = meta.icon;
        const list = RETAILERS.filter((r) => r.kind === kind);

        return (
          <section key={kind} className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
                <Icon className="size-4 text-accent" aria-hidden />
                {meta.label}
              </h2>
              <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">{meta.blurb}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {list.map((retailer) => (
                <article
                  key={retailer.name}
                  className="flex flex-col rounded-xl border border-edge bg-surface-1 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={retailer.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-accent"
                    >
                      {retailer.name}
                      <ExternalLink className="size-3 opacity-60" aria-hidden />
                    </a>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {retailer.condition.map((c) => (
                        <Badge key={c} variant={c === "new" ? "accent" : "outline"}>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                    {retailer.summary}
                  </p>

                  {retailer.physicalStore ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-good">
                      <Building2 className="size-3 shrink-0" aria-hidden />
                      Walk-in: {retailer.physicalStore}
                    </p>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
                      <Building2 className="size-3 shrink-0" aria-hidden />
                      Physical counter not confirmed
                    </p>
                  )}

                  <ul className="mt-2.5 space-y-1">
                    {retailer.strengths.map((strength) => (
                      <li key={strength} className="flex gap-1.5 text-[11px] text-ink-secondary">
                        <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-good" />
                        {strength}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2.5 flex gap-1.5 border-t border-edge pt-2.5 text-[11px] leading-relaxed text-warning">
                    <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                    <span>{retailer.watchFor}</span>
                  </p>

                  <p className="mt-2.5 flex flex-wrap gap-1 text-[10px] text-ink-muted">
                    {retailer.stocks.map((s) => (
                      <span key={s} className="rounded bg-surface-2 px-1.5 py-0.5">
                        {s}
                      </span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* ---- physical markets ---- */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <MapPin className="size-4 text-accent" aria-hidden />
            Physical hardware markets
          </h2>
          <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
            Worth the trip when you need a part today, want to negotiate, or would rather
            see the box before paying. Quality varies far more than online, so the
            precautions below matter more here than anywhere else.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {HARDWARE_MARKETS.map((market) => (
            <article key={market.name} className="rounded-xl border border-edge bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-ink">
                {market.name}
                <span className="ml-2 text-xs font-normal text-ink-muted">{market.city}</span>
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                {market.summary}
              </p>
              <p className="mt-2 flex gap-1.5 border-t border-edge pt-2 text-[11px] leading-relaxed text-warning">
                <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                <span>{market.watchFor}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---- buying safely ---- */}
      <section className="space-y-3 rounded-xl border border-edge bg-surface-1 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <ShieldCheck className="size-4 text-good" aria-hidden />
          Buying safely in India
        </h2>
        <ul className="space-y-2.5 text-xs leading-relaxed text-ink-secondary">
          <li>
            <strong className="text-ink">Always take a GST invoice.</strong> It is your
            warranty document. Without it most manufacturers will not process an RMA, and
            you lose the ability to claim input credit if you are buying through a business.
          </li>
          <li>
            <strong className="text-ink">Check the serial number against the invoice</strong>{" "}
            before leaving a physical store, and register the product on the manufacturer&rsquo;s
            site the same day. This is the single most common gap that turns into a refused
            warranty claim later.
          </li>
          <li>
            <strong className="text-ink">Ask whether stock carries Indian warranty.</strong>{" "}
            Imported or grey-market parts are often cheaper and frequently have no local RMA
            path at all — a dead graphics card then becomes entirely your problem.
          </li>
          <li>
            <strong className="text-ink">Record unboxing for high-value orders.</strong> For
            anything above roughly ₹50,000, a continuous unboxing video is what marketplace
            disputes actually turn on when the wrong item or an empty box arrives.
          </li>
          <li>
            <strong className="text-ink">Prefer card or platform payment over UPI transfer</strong>{" "}
            with sellers you have not used before. A direct transfer has no chargeback path.
          </li>
          <li>
            <strong className="text-ink">Cross-check prices across at least two specialists.</strong>{" "}
            Component pricing in India varies widely between retailers for identical SKUs,
            and marketplace listings frequently sit well above the specialists.
          </li>
        </ul>
      </section>
    </div>
  );
}
