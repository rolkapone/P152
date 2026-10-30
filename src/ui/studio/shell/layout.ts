/**
 * Window width rule of the Studio shell (UX US-005 §2.2, design-system.md §15): docked panels
 * from 1024 px CSS, drawers below (1366 × 768 at 200 % zoom is 683 px wide). Same threshold
 * as the container queries of Shell.module.css (the shell fills the window).
 */
export const NARROW_QUERY = "(max-width: 1023.98px)";

/** `matchMedia` may be missing (test DOMs): wide then. */
export function isNarrowWindow(win: Window = window): boolean {
  return typeof win.matchMedia === "function" && win.matchMedia(NARROW_QUERY).matches;
}

/** Calls `onChange` when the window crosses the threshold; returns the clean-up. */
export function watchNarrowWindow(onChange: (narrow: boolean) => void, win: Window = window) {
  if (typeof win.matchMedia !== "function") return () => {};
  const query = win.matchMedia(NARROW_QUERY);
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
