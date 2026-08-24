"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { COMPONENT_BY_ID, SEARCH_INDEX, type ResolvedComponent } from "@/lib/catalog";
import { highlightMatch, search } from "@/lib/search";
import { CATEGORY_SHORT_LABELS, type Category } from "@/lib/validations/component";
import { formatInr } from "@/lib/format";
import { useHotkey } from "@/hooks/use-hotkey";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Bold the characters the user actually typed, ignoring spacing. */
function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightMatch(text, query).map((segment, index) => (
        <span
          key={index}
          className={segment.matched ? "font-semibold text-accent-strong" : undefined}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

export interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Restrict results to one category — used by the comparison slot swapper. */
  category?: Category;
  /** Ids that cannot be chosen (already occupying a comparison slot). */
  excludeIds?: readonly string[];
  /** Overrides navigation; used when picking a replacement rather than browsing. */
  onSelect?: (component: ResolvedComponent) => void;
  title?: string;
  description?: string;
}

export function GlobalSearch({
  open,
  onOpenChange,
  category,
  excludeIds,
  onSelect,
  title = "Search hardware",
  description,
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const allowedIds = React.useMemo(() => {
    if (!category && !excludeIds?.length) return undefined;
    const allowed = new Set<string>();
    for (const [id, component] of COMPONENT_BY_ID) {
      if (category && component.category !== category) continue;
      if (excludeIds?.includes(id)) continue;
      allowed.add(id);
    }
    return allowed;
  }, [category, excludeIds]);

  const results = React.useMemo(() => {
    if (query.trim().length === 0) {
      // Empty query: show a useful default rather than nothing at all.
      return [...COMPONENT_BY_ID.values()]
        .filter((component) => !allowedIds || allowedIds.has(component.id))
        .slice(0, 8);
    }
    return search(SEARCH_INDEX, query, { limit: 12, allowedIds })
      .map((hit) => COMPONENT_BY_ID.get(hit.id))
      .filter((component): component is ResolvedComponent => component !== undefined);
  }, [query, allowedIds]);

  const handleSelect = React.useCallback(
    (component: ResolvedComponent) => {
      onOpenChange(false);
      if (onSelect) onSelect(component);
      else router.push(`/component/${component.slug}/`);
    },
    [onSelect, onOpenChange, router],
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={title}
      // The trigram engine ranks results; cmdk must not re-sort them.
      shouldFilter={false}
      // cmdk applies `className` to the inner Command element and the two
      // *ClassName props to the Radix overlay/content wrappers.
      className="flex flex-col"
      overlayClassName="fixed inset-0 z-100 bg-ink/35 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] z-100 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-edge-strong bg-surface-1 shadow-2xl shadow-black/70"
    >
      <div className="flex items-center gap-3 border-b border-edge px-4">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder={
            category
              ? `Search ${CATEGORY_SHORT_LABELS[category]} models…`
              : "Search processors, GPUs, memory, storage, boards…"
          }
          className="h-13 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      {description && (
        <p className="border-b border-edge bg-surface-2/40 px-4 py-2 text-xs text-ink-muted">
          {description}
        </p>
      )}

      <Command.List className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="px-3 py-10 text-center text-sm text-ink-muted">
          No component matches <span className="font-medium text-ink">“{query}”</span>.
          <span className="mt-1 block text-xs">
            Trigram matching tolerates typos and missing spaces — try a shorter fragment.
          </span>
        </Command.Empty>

        {results.map((component) => (
          <Command.Item
            key={component.id}
            value={component.id}
            onSelect={() => handleSelect(component)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
              "data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink",
            )}
          >
            <Badge variant="outline" className="w-14 shrink-0 justify-center font-mono">
              {CATEGORY_SHORT_LABELS[component.category]}
            </Badge>
            <span className="min-w-0 flex-1 truncate text-ink">
              <Highlighted text={component.name} query={query} />
            </span>
            <span className="hidden shrink-0 text-xs text-ink-muted sm:inline">
              {component.brand}
            </span>
            <span className="tnum shrink-0 text-xs text-ink-secondary">
              {formatInr(component.inrPrice)}
            </span>
          </Command.Item>
        ))}
      </Command.List>

      <div className="flex items-center gap-4 border-t border-edge bg-surface-2/40 px-4 py-2 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1">
          <ArrowUp className="size-3" />
          <ArrowDown className="size-3" />
          navigate
        </span>
        <span className="flex items-center gap-1">
          <CornerDownLeft className="size-3" />
          select
        </span>
        <span className="ml-auto font-mono">esc to close</span>
      </div>
    </Command.Dialog>
  );
}

/** Wires the global palette to its "/" and Cmd/Ctrl+K shortcuts. */
export function useGlobalSearch() {
  const [open, setOpen] = React.useState(false);
  useHotkey(["k"], () => setOpen((value) => !value), { requireModifier: true });
  useHotkey(["/"], () => setOpen(true));
  return { open, setOpen };
}
