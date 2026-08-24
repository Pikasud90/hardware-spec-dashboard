"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Cpu, FlaskConical, Search, Sigma, Store, Wrench } from "lucide-react";
import { GlobalSearch, useGlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Catalogue", icon: Cpu, exact: true },
  { href: "/build/", label: "Build planner", icon: Wrench },
  { href: "/compare/", label: "Compare", icon: BarChart3 },
  { href: "/analytics/", label: "Analytics", icon: FlaskConical },
  { href: "/where-to-buy/", label: "Where to buy", icon: Store },
  { href: "/methodology/", label: "Methodology", icon: Sigma },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { open, setOpen } = useGlobalSearch();
  const [platformKey, setPlatformKey] = React.useState("Ctrl");

  React.useEffect(() => {
    // Read the platform after mount so server and client markup agree.
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
      setPlatformKey("⌘");
    }
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-40 border-b border-edge bg-surface-0/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-md border border-accent/40 bg-accent/12 text-accent-strong"
            >
              <Cpu className="size-4" />
            </span>
            <span className="hidden sm:inline">Hardware Spec Dashboard</span>
            <span className="sm:hidden">HSD</span>
          </Link>

          <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-ink"
                      : "text-ink-secondary hover:bg-surface-2/60 hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto flex h-9 items-center gap-2 rounded-md border border-edge bg-surface-1 px-3 text-sm text-ink-muted transition-colors hover:border-edge-strong hover:text-ink-secondary sm:w-56"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="hidden flex-1 text-left sm:inline">Search hardware…</span>
            <kbd className="hidden shrink-0 rounded border border-edge-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline">
              {platformKey}K
            </kbd>
          </button>

          <ThemeToggle />
        </div>

        {/* Compact nav for narrow screens (US4). */}
        <nav
          aria-label="Primary mobile"
          className="flex items-center gap-1 overflow-x-auto border-t border-edge px-4 py-1.5 md:hidden"
        >
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-xs transition-colors",
                  active ? "bg-surface-2 text-ink" : "text-ink-secondary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <GlobalSearch open={open} onOpenChange={setOpen} />
    </TooltipProvider>
  );
}
