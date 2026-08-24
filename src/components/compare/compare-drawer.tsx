"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Plus, Trash2, X } from "lucide-react";
import {
  MAX_COMPARE_SLOTS,
  MIN_COMPARE_SLOTS,
  useCompare,
} from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_LABELS } from "@/lib/validations/component";
import { cn, plural } from "@/lib/utils";

/**
 * Sticky comparison tray.
 *
 * Always shows all four slots — filled ones as chips, empty ones as dashed
 * placeholders — so the capacity is legible without having to discover it by
 * hitting the limit.
 */
export function CompareDrawer() {
  const {
    items, category, remove, clear, hydrated,
    pendingSwitch, confirmSwitch, cancelSwitch,
  } = useCompare();
  const pathname = usePathname();

  // The comparison page manages its own selection, and the build planner is a
  // different workflow whose summary rail the tray would collide with.
  const suppressed = pathname.startsWith("/compare") || pathname.startsWith("/build");
  const visible = hydrated && items.length > 0 && !suppressed;

  const href =
    category && items.length >= MIN_COMPARE_SLOTS
      ? `/compare/?category=${category}&ids=${items.map((item) => item.id).join(",")}`
      : null;

  return (
    <>
      <div
        aria-hidden={!visible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-edge-strong bg-surface-1/95 backdrop-blur-md transition-transform duration-200",
          visible ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div
          role="region"
          aria-label="Comparison tray"
          className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center"
        >
          <div className="flex items-center gap-2 lg:shrink-0">
            <Badge variant="accent">
              {category ? CATEGORY_LABELS[category] : "Comparison"}
            </Badge>
            <span className="text-xs text-ink-muted">
              {items.length} of {MAX_COMPARE_SLOTS} {plural(items.length, "slot")}
            </span>
          </div>

          <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {Array.from({ length: MAX_COMPARE_SLOTS }, (_, index) => {
              const item = items[index];
              if (!item) {
                return (
                  <li
                    key={`empty-${index}`}
                    className="flex h-9 min-w-36 shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-edge-strong px-3 text-[11px] text-ink-muted"
                  >
                    <Plus className="size-3" aria-hidden />
                    Empty slot
                  </li>
                );
              }
              return (
                <li
                  key={item.id}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-edge-strong bg-surface-2 pl-3 pr-1 text-xs text-ink"
                >
                  <span className="max-w-52 truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name} from comparison`}
                    className="rounded p-1 text-ink-muted transition-colors hover:bg-surface-3 hover:text-critical"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 aria-hidden />
              Clear
            </Button>
            {href ? (
              <Button asChild variant="primary" size="sm">
                <Link href={href}>
                  Compare {items.length}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled>
                Add {MIN_COMPARE_SLOTS - items.length} more
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category isolation: an explicit choice, never a silent reset (US2). */}
      <Dialog
        open={pendingSwitch !== null}
        onOpenChange={(next) => {
          if (!next) cancelSwitch();
        }}
      >
        <DialogContent aria-describedby="switch-description">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-ink">
              Switch comparison category?
            </DialogTitle>
            <DialogDescription id="switch-description" className="text-sm text-ink-secondary">
              Comparing across categories is not supported — a processor and a graphics
              card share no comparable specifications.
            </DialogDescription>
          </DialogHeader>
          {pendingSwitch && (
            <div className="space-y-3 p-5 text-sm">
              <p className="text-ink-secondary">
                Your tray currently holds{" "}
                <span className="font-medium text-ink">
                  {CATEGORY_LABELS[pendingSwitch.fromCategory]}
                </span>
                . Clearing it and starting a new{" "}
                <span className="font-medium text-ink">
                  {CATEGORY_LABELS[pendingSwitch.component.category]}
                </span>{" "}
                comparison with:
              </p>
              <p className="rounded-lg border border-edge bg-surface-2 px-3 py-2 font-medium text-ink">
                {pendingSwitch.component.name}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={cancelSwitch}>
              Keep current comparison
            </Button>
            <Button variant="primary" size="sm" onClick={confirmSwitch}>
              Clear and switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
