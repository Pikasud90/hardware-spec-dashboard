"use client";

import * as React from "react";

/** True when focus is somewhere the user is typing prose, not navigating. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable
  );
}

/**
 * Global keyboard shortcut (US11).
 *
 * Bare-key shortcuts such as "/" are suppressed while the user is typing;
 * modifier combinations such as Cmd+K are not, because they cannot be produced
 * accidentally mid-word.
 */
export function useHotkey(
  keys: string[],
  handler: (event: KeyboardEvent) => void,
  { requireModifier = false }: { requireModifier?: boolean } = {},
) {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  // Call sites pass an inline array literal, so the identity changes on every
  // render. Collapsing it to a string gives the effect a stable dependency
  // that still re-binds when the actual key set changes.
  const keySignature = keys.join(",");

  React.useEffect(() => {
    const bound = new Set(keySignature.split(","));
    function onKeyDown(event: KeyboardEvent) {
      const modifier = event.metaKey || event.ctrlKey;
      if (requireModifier && !modifier) return;
      if (!requireModifier && modifier) return;
      if (!bound.has(event.key.toLowerCase())) return;
      if (!requireModifier && isTypingTarget(event.target)) return;
      event.preventDefault();
      handlerRef.current(event);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keySignature, requireModifier]);
}
