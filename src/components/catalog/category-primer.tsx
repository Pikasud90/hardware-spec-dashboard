"use client";

import * as React from "react";
import { BookOpen, ChevronDown, CircleAlert, Compass, Table2, TriangleAlert } from "lucide-react";
import { PRIMERS, type Primer } from "@/lib/data/primers";
import { CATEGORY_LABELS, type Category } from "@/lib/validations/component";
import { cn } from "@/lib/utils";

/**
 * Reference documentation for a category, shown above its catalogue.
 *
 * A specification table is only useful to someone who can already decode it.
 * This is the other half — what the terms mean, what the standards are, how to
 * choose, and which mistakes cost money.
 *
 * The orientation paragraphs are always visible because they are the part
 * everyone benefits from; the reference material below is behind a disclosure
 * so it does not push the catalogue off the screen for people who already know
 * it. The open state is remembered per category.
 */

type Section = "concepts" | "tables" | "guidance" | "pitfalls";

const SECTION_META: Record<Section, { label: string; icon: typeof BookOpen }> = {
  concepts: { label: "Terminology", icon: BookOpen },
  tables: { label: "Reference tables", icon: Table2 },
  guidance: { label: "How to choose", icon: Compass },
  pitfalls: { label: "Common mistakes", icon: TriangleAlert },
};

export function CategoryPrimer({ category }: { category: Category }) {
  const primer = PRIMERS[category];
  const [open, setOpen] = React.useState(false);
  const [section, setSection] = React.useState<Section>("concepts");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const storageKey = `hsd.primer.${category}`;

  React.useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(storageKey) === "open");
    } catch {
      /* private browsing; default closed */
    }
  }, [storageKey]);

  const toggle = React.useCallback(() => {
    setOpen((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(storageKey, next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storageKey]);

  // Reset the inner state when the category changes underneath us.
  React.useEffect(() => {
    setSection("concepts");
    setExpanded(null);
  }, [category]);

  if (!primer) return null;

  return (
    <section
      aria-label={`About ${CATEGORY_LABELS[category]}`}
      className="overflow-hidden rounded-xl border border-edge bg-surface-1"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent/10 text-accent"
          >
            <BookOpen className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {primer.title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{primer.tagline}</p>
          </div>
        </div>

        <div className="mt-3 space-y-3 sm:pl-11">
          {primer.intro.map((paragraph, index) => (
            <p key={index} className="max-w-3xl text-sm leading-relaxed text-ink-secondary">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-4 sm:pl-11">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-edge-strong hover:text-ink"
          >
            {open ? "Hide reference" : "Terminology, tables and buying guidance"}
            <ChevronDown
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-edge">
          <div
            role="tablist"
            aria-label="Reference sections"
            className="flex gap-1 overflow-x-auto border-b border-edge bg-surface-2/40 px-3 py-2"
          >
            {(Object.keys(SECTION_META) as Section[]).map((key) => {
              const meta = SECTION_META[key];
              const Icon = meta.icon;
              const active = section === key;
              const count =
                key === "concepts" ? primer.concepts.length
                : key === "tables" ? primer.tables.length
                : key === "guidance" ? primer.guidance.length
                : primer.pitfalls.length;
              return (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setSection(key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-accent/12 text-accent"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink-secondary",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {meta.label}
                  <span className="tnum text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            {section === "concepts" && (
              <dl className="space-y-1.5">
                {primer.concepts.map((concept) => {
                  const isOpen = expanded === concept.term;
                  return (
                    <div
                      key={concept.term}
                      className="rounded-lg border border-edge bg-surface-2/40"
                    >
                      <dt>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : concept.term)}
                          className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-ink">
                              {concept.term}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                              {concept.short}
                            </span>
                          </span>
                          <ChevronDown
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0 text-ink-muted transition-transform",
                              isOpen && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      </dt>
                      {isOpen && (
                        <dd className="border-t border-edge px-3 py-2.5 text-xs leading-relaxed text-ink-secondary">
                          {concept.detail}
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
            )}

            {section === "tables" && (
              <div className="space-y-5">
                {primer.tables.map((table) => (
                  <figure key={table.title}>
                    <figcaption className="mb-2">
                      <h3 className="text-xs font-semibold text-ink">{table.title}</h3>
                      <p className="mt-0.5 max-w-3xl text-[11px] leading-relaxed text-ink-muted">
                        {table.caption}
                      </p>
                    </figcaption>
                    <div className="overflow-x-auto rounded-lg border border-edge">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-edge bg-surface-2/50">
                            {table.columns.map((column) => (
                              <th
                                key={column}
                                scope="col"
                                className="whitespace-nowrap px-3 py-2 text-left font-medium text-ink-secondary"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, index) => (
                            <tr key={index} className="border-b border-edge/50 last:border-0">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className={cn(
                                    "px-3 py-2 align-top",
                                    cellIndex === 0 ? "font-medium text-ink" : "text-ink-secondary",
                                  )}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </figure>
                ))}
              </div>
            )}

            {section === "guidance" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {primer.guidance.map((item) => (
                  <div
                    key={item.heading}
                    className="rounded-lg border border-edge bg-surface-2/40 p-3"
                  >
                    <h3 className="text-xs font-semibold text-ink">{item.heading}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {section === "pitfalls" && (
              <ul className="space-y-2">
                {primer.pitfalls.map((pitfall) => (
                  <li
                    key={pitfall}
                    className="flex gap-2.5 rounded-lg border border-warning/35 bg-warning/8 p-3 text-xs leading-relaxed text-ink-secondary"
                  >
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                    {pitfall}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export type { Primer };
