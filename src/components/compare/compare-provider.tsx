"use client";

import * as React from "react";
import { COMPONENT_BY_ID, type ResolvedComponent } from "@/lib/catalog";
import type { Category } from "@/lib/validations/component";

/**
 * Comparison tray state.
 *
 * Two invariants are enforced here rather than in the components that consume
 * it, so no view can violate them:
 *
 *  1. **Category isolation (US2)** — the tray holds one category at a time.
 *     Adding across categories does not silently clear the tray; it raises a
 *     `pendingSwitch` that the drawer turns into an explicit confirmation.
 *  2. **Capacity** — at most four slots, because beyond that the comparison
 *     matrix stops being readable on any realistic screen.
 *
 * Selection survives reloads via `localStorage`, read after mount so the
 * server-rendered and first client render agree.
 */

export const MAX_COMPARE_SLOTS = 4;
export const MIN_COMPARE_SLOTS = 2;
const STORAGE_KEY = "hsd.compare.v1";

interface PendingSwitch {
  component: ResolvedComponent;
  fromCategory: Category;
}

interface CompareContextValue {
  category: Category | null;
  ids: string[];
  items: ResolvedComponent[];
  isSelected: (id: string) => boolean;
  /** True when another component of the current category would still fit. */
  hasCapacity: boolean;
  toggle: (component: ResolvedComponent) => void;
  add: (component: ResolvedComponent) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Replace the component in a specific slot, preserving column order (US9). */
  swap: (slotIndex: number, nextId: string) => void;
  setSelection: (category: Category, ids: string[]) => void;
  pendingSwitch: PendingSwitch | null;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  hydrated: boolean;
}

const CompareContext = React.createContext<CompareContextValue | null>(null);

interface PersistedState {
  category: Category | null;
  ids: string[];
}

function readPersisted(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("ids" in parsed) ||
      !Array.isArray((parsed as PersistedState).ids)
    ) {
      return null;
    }
    const state = parsed as PersistedState;
    // Drop ids that no longer exist in the catalogue — a stale bookmark must
    // degrade to a smaller selection, never to a crash (US3, US5).
    const ids = state.ids.filter((id) => COMPONENT_BY_ID.has(id)).slice(0, MAX_COMPARE_SLOTS);
    if (ids.length === 0) return null;
    const category = COMPONENT_BY_ID.get(ids[0])?.category ?? null;
    return { category, ids: ids.filter((id) => COMPONENT_BY_ID.get(id)?.category === category) };
  } catch {
    return null;
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = React.useState<Category | null>(null);
  const [ids, setIds] = React.useState<string[]>([]);
  const [pendingSwitch, setPendingSwitch] = React.useState<PendingSwitch | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const persisted = readPersisted();
    if (persisted) {
      setCategory(persisted.category);
      setIds(persisted.ids);
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ category, ids }));
    } catch {
      // Private-browsing modes can refuse writes; selection simply will not persist.
    }
  }, [category, ids, hydrated]);

  const items = React.useMemo(
    () =>
      ids
        .map((id) => COMPONENT_BY_ID.get(id))
        .filter((item): item is ResolvedComponent => item !== undefined),
    [ids],
  );

  const add = React.useCallback(
    (component: ResolvedComponent) => {
      setIds((current) => {
        if (current.includes(component.id)) return current;
        if (category !== null && category !== component.category) {
          setPendingSwitch({ component, fromCategory: category });
          return current;
        }
        if (current.length >= MAX_COMPARE_SLOTS) return current;
        if (category === null) setCategory(component.category);
        return [...current, component.id];
      });
    },
    [category],
  );

  const remove = React.useCallback((id: string) => {
    setIds((current) => {
      const next = current.filter((existing) => existing !== id);
      if (next.length === 0) setCategory(null);
      return next;
    });
  }, []);

  const toggle = React.useCallback(
    (component: ResolvedComponent) => {
      if (ids.includes(component.id)) remove(component.id);
      else add(component);
    },
    [ids, add, remove],
  );

  const clear = React.useCallback(() => {
    setIds([]);
    setCategory(null);
    setPendingSwitch(null);
  }, []);

  const swap = React.useCallback((slotIndex: number, nextId: string) => {
    setIds((current) => {
      const replacement = COMPONENT_BY_ID.get(nextId);
      if (!replacement) return current;
      if (slotIndex < 0 || slotIndex >= current.length) return current;
      // Swapping in something already present would collapse two columns into
      // one; treat that as a no-op rather than silently shrinking the matrix.
      if (current.includes(nextId)) return current;
      const next = [...current];
      next[slotIndex] = nextId;
      return next;
    });
  }, []);

  const setSelection = React.useCallback((nextCategory: Category, nextIds: string[]) => {
    setCategory(nextCategory);
    setIds(nextIds.slice(0, MAX_COMPARE_SLOTS));
  }, []);

  const confirmSwitch = React.useCallback(() => {
    if (!pendingSwitch) return;
    setCategory(pendingSwitch.component.category);
    setIds([pendingSwitch.component.id]);
    setPendingSwitch(null);
  }, [pendingSwitch]);

  const cancelSwitch = React.useCallback(() => setPendingSwitch(null), []);

  const value = React.useMemo<CompareContextValue>(
    () => ({
      category,
      ids,
      items,
      isSelected: (id: string) => ids.includes(id),
      hasCapacity: ids.length < MAX_COMPARE_SLOTS,
      toggle,
      add,
      remove,
      clear,
      swap,
      setSelection,
      pendingSwitch,
      confirmSwitch,
      cancelSwitch,
      hydrated,
    }),
    [
      category, ids, items, toggle, add, remove, clear, swap, setSelection,
      pendingSwitch, confirmSwitch, cancelSwitch, hydrated,
    ],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const context = React.useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within a CompareProvider");
  return context;
}
