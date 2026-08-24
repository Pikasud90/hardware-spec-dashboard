"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme control with three states rather than two.
 *
 * "System" is a real choice, not the absence of one: it follows the OS, which
 * is what most people actually want. An explicit light or dark choice stamps
 * `data-theme` on the root element and wins over the OS setting in both
 * directions.
 *
 * The matching pre-paint script lives in the document head so the stored
 * choice is applied before first paint — otherwise a dark-mode user gets a
 * white flash on every navigation.
 */

export const THEME_STORAGE_KEY = "hsd.theme";
type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: Array<{ value: ThemeChoice; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

export function ThemeToggle() {
  const [choice, setChoice] = React.useState<ThemeChoice>("system");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null;
    if (stored === "light" || stored === "dark" || stored === "system") setChoice(stored);
    setMounted(true);
  }, []);

  const select = React.useCallback((next: ThemeChoice) => {
    setChoice(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse writes; the choice simply will not persist.
    }
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex rounded-md border border-edge bg-surface-1 p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        // Before mount the stored choice is unknown, so nothing is marked
        // active — this keeps server and first client render identical.
        const active = mounted && choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={`${option.label} theme`}
            onClick={() => select(option.value)}
            className={cn(
              "grid size-7 place-items-center rounded transition-colors",
              active
                ? "bg-surface-3 text-ink"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink-secondary",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inline, blocking script that applies the stored theme before first paint.
 * Kept deliberately tiny and dependency-free because it runs synchronously.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(c==="light"||c==="dark"){document.documentElement.setAttribute("data-theme",c);}}catch(e){}})();`;
