"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, CircleHelp, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { ResolvedComponent } from "@/lib/catalog";
import { PRICE_CAPTURED_ON, PRICE_SOURCE_NOTE } from "@/lib/pricing";

/**
 * How much to trust the rupee figure beside it.
 *
 * Indian component pricing varies a great deal between retailers, and DDR5 in
 * particular has been repricing sharply through the 2026 memory shortage.
 * Showing a single number with no indication of its reliability would imply a
 * precision the data does not have, so confidence travels with the price
 * everywhere it appears.
 */

const CONFIDENCE_COPY = {
  high: {
    label: "Verified",
    variant: "good" as const,
    icon: CircleCheck,
    detail: "A current listing was found on an Indian retailer or price aggregator.",
  },
  medium: {
    label: "Approx.",
    variant: "neutral" as const,
    icon: CircleHelp,
    detail:
      "Listings were found but disagree materially between retailers, or the closest match was a sibling variant.",
  },
  low: {
    label: "Volatile",
    variant: "warning" as const,
    icon: CircleAlert,
    detail:
      "This category is repricing fast or listings are thin. Treat the figure as a rough guide and check a retailer before committing.",
  },
};

const AVAILABILITY_COPY = {
  available: null,
  limited: {
    label: "Limited stock",
    detail: "Still sold in India, but stock is thin and pricing is inconsistent.",
  },
  discontinued: {
    label: "Not sold new",
    detail:
      "No longer available new in India. Listed for comparison against parts you may already own, or to check the second-hand market against.",
  },
};

export function PriceConfidenceBadge({
  component,
  showAvailability = true,
}: {
  component: Pick<ResolvedComponent, "priceConfidence" | "availability">;
  showAvailability?: boolean;
}) {
  const confidence = CONFIDENCE_COPY[component.priceConfidence];
  const availability = AVAILABILITY_COPY[component.availability];
  const Icon = confidence.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Tooltip
        content={
          <span>
            <span className="block font-medium text-ink">
              Price confidence: {confidence.label}
            </span>
            <span className="mt-0.5 block">{confidence.detail}</span>
            <span className="mt-1 block text-ink-muted">
              {PRICE_SOURCE_NOTE} Captured {PRICE_CAPTURED_ON}.
            </span>
          </span>
        }
      >
        <Badge variant={confidence.variant} className="cursor-help">
          <Icon className="size-3" aria-hidden />
          {confidence.label}
        </Badge>
      </Tooltip>

      {showAvailability && availability && (
        <Tooltip content={availability.detail}>
          <Badge
            variant={component.availability === "discontinued" ? "critical" : "outline"}
            className="cursor-help"
          >
            <PackageX className="size-3" aria-hidden />
            {availability.label}
          </Badge>
        </Tooltip>
      )}
    </span>
  );
}
